import fs from 'fs';
import { normalize } from '@rest-hooks/normalizr';
import path from 'path';
import MockDate from 'mockdate';

import input from './input.json';
import postsSchema from './schema';

MockDate.set(new Date('2/20/2000'));

const normalizedData = normalize(input, postsSchema);
const output = JSON.stringify(normalizedData, null, 2);
fs.writeFileSync(path.resolve(__dirname, './output.json'), output);
