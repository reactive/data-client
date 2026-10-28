import { RestEndpoint } from '@data-client/rest';

import { slowLink } from './slowLink';

const sender = (name: string, img: number) => ({
  name,
  avatar: `https://i.pravatar.cc/64?img=${img}`,
});

const messages = [
  {
    id: 1,
    from: sender('Maya Chen', 5),
    subject: 'Design review moved to Thursday',
    body: [
      'Priya is out on Wednesday, so I moved the design review to Thursday at 2pm. Same room, same agenda.',
      'If you still want feedback on the onboarding screens before then, drop them in the shared folder tonight.',
    ],
  },
  {
    id: 2,
    from: sender('Leo Fischer', 12),
    subject: 'Your boarding pass for Lisbon',
    body: [
      'Flight TP 1351 leaves at 7:05am from gate B12. Boarding closes 20 minutes before departure.',
      'Show the QR code below at security and at the gate. One cabin bag is included in your fare.',
    ],
  },
  {
    id: 3,
    from: sender('Ama Owusu', 45),
    subject: 'Q3 numbers are in',
    body: [
      'Revenue is up 18% on last quarter, mostly from the annual plans we launched in August.',
      'Churn held steady. The full report is attached; the slides for Monday are in the team drive.',
    ],
  },
  {
    id: 4,
    from: sender('Ravi Kumar', 33),
    subject: 'Can you look at the checkout PR?',
    body: [
      'It moves the cart totals into a computed field, so the summary and the badge always agree.',
      'Tests pass. I would love a second pair of eyes on the tax rounding before we merge.',
    ],
  },
  {
    id: 5,
    from: sender('Hana Sato', 47),
    subject: 'Photos from Saturday',
    body: [
      'Here are the photos from the hike! The one at the summit came out great, even with the fog.',
      'Let me know which ones you want printed and I will order them with mine this week.',
    ],
  },
  {
    id: 6,
    from: sender('Sofia Reyes', 32),
    subject: 'Dinner on Friday?',
    body: [
      'The new ramen place on Fifth finally opened. I can book a table for four at 7:30.',
      'Tell me by Thursday so I can grab the reservation before it fills up.',
    ],
  },
];

/** Each message with its HTML and inline images: 150 KB */
const MESSAGE_BYTES = 150_000;

const urlPrefix = 'https://api.example.com';

/** The inbox lists every message without its body; opening one downloads
 * it whole over the slow link, so each message left open slows the rest */
export const inboxFixtures = [
  {
    endpoint: new RestEndpoint({ urlPrefix, path: '/messages' }),
    response: () => messages.map(({ body, ...summary }) => summary),
    delay: 300,
  },
  {
    endpoint: new RestEndpoint({ urlPrefix, path: '/messages/:id' }),
    async fetchResponse(
      this: { download?: ReturnType<typeof slowLink> },
      input: RequestInfo,
      init: RequestInit,
    ) {
      // a weak mobile signal: 100 KB/s, shared by every open download (one
      // per playground: `this` is its interceptor data)
      this.download ??= slowLink(100);
      await this.download(MESSAGE_BYTES, init.signal);
      const id = Number(`${input}`.split('/').pop());
      return messages.find(message => message.id === id);
    },
  },
];
