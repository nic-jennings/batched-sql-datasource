import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m30s", target: 10 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    http_req_duration: ["p(95)<250"], // 95% of requests should be below 250ms
  },
};

export default function () {
  const query = `
  query EventsBatched {
    eventsBatched {
      id
      title
      attributes {
        id
        key
        value
      }
    }
  }
  `;

  const headers = {
    "Content-Type": "application/json",
    user_id: "something",
    features: "readConstraints",
  };

  const res = http.post(
    `http://${__ENV.TARGET_HOSTNAME}/`,
    JSON.stringify({ query: query }),
    {
      headers: headers,
    }
  );
  sleep(1);
  check(res, {
    "Status is 200": (r) => r.status === 200,
    "Has event": (r) => {
      const body = JSON.parse(String(r.body));
      return body.data.eventsBatched.length > 0;
    },
  });
}
