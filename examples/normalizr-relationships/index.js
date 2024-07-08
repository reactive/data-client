import { normalize } from '@data-client/normalizr';
import fs from 'fs';
import MockDate from 'mockdate';
import path from 'path';

import input from './input.json';
import postsSchema from './schema';

MockDate.set(new Date('2/20/2000'));

const normalizedData = normalize(postsSchema, input);
const output = JSON.stringify(normalizedData, null, 2);
fs.writeFileSync(path.resolve(__dirname, './output.json'), output);
