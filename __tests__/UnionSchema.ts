import { Entity, Union } from '@data-client/rest';

export enum SequenceType {
  TemporalCatDiff = 'temporal_cat_diff',
  TemporalCatCount = 'temporal_cat_count',
  TemporalMeanShift = 'temporal_mean_shift',
  TemporalSumShift = 'temporal_sum_shift',
  TemporalCountShift = 'temporal_count_shift',
}

export abstract class Sequence extends Entity {
  sequence_type: SequenceType = SequenceType.TemporalCatCount;

  subpopulations: any[][] = [];
  sequence_id = 0;

  pk() {
    return `${this.sequence_id}`;
  }
}

export class CategoricalSequence extends Sequence {
  sequence_type: SequenceType = SequenceType.TemporalCatCount;
}

export class ContinuousSequence extends Sequence {
  sequence_type: SequenceType = SequenceType.TemporalCountShift;
}

export const waterfallSchema = {
  analysisId: '',
  sequences: [
    new Union(
      {
        [SequenceType.TemporalCatCount]: CategoricalSequence,
        [SequenceType.TemporalCatDiff]: CategoricalSequence,
        [SequenceType.TemporalMeanShift]: ContinuousSequence,
        [SequenceType.TemporalSumShift]: ContinuousSequence,
        [SequenceType.TemporalCountShift]: ContinuousSequence,
      },
      'sequence_type',
    ),
  ],
};
