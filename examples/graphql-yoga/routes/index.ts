import { defineRoute } from "$fresh/server.ts";

export default defineRoute(() => {
  return new Response("", {
    status: 303,
    headers: {
      location:
        "/graphql?query=query+Joke+%7B%0A++joke%0A%7D%0A%0Asubscription+Countdown+%7B%0A++countdown%0A%7D",
    },
  });
});
