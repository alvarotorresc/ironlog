import { View } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';
import { colors } from '@/constants/theme';

import AbCrunch from '@/assets/illustrations/ab-crunch.svg';
import BarbellCurl from '@/assets/illustrations/barbell-curl.svg';
import BarbellRow from '@/assets/illustrations/barbell-row.svg';
import BenchPress from '@/assets/illustrations/bench-press.svg';
import Burpees from '@/assets/illustrations/burpees.svg';
import CableCrossover from '@/assets/illustrations/cable-crossover.svg';
import CalfRaise from '@/assets/illustrations/calf-raise.svg';
import Cycling from '@/assets/illustrations/cycling.svg';
import Deadlift from '@/assets/illustrations/deadlift.svg';
import Dips from '@/assets/illustrations/dips.svg';
import DumbbellFly from '@/assets/illustrations/dumbbell-fly.svg';
import FacePull from '@/assets/illustrations/face-pull.svg';
import FrontRaise from '@/assets/illustrations/front-raise.svg';
import HammerCurl from '@/assets/illustrations/hammer-curl.svg';
import HangingLegRaise from '@/assets/illustrations/hanging-leg-raise.svg';
import InclineBenchPress from '@/assets/illustrations/incline-bench-press.svg';
import JumpRope from '@/assets/illustrations/jump-rope.svg';
import LateralRaise from '@/assets/illustrations/lateral-raise.svg';
import LatPulldown from '@/assets/illustrations/lat-pulldown.svg';
import LegCurl from '@/assets/illustrations/leg-curl.svg';
import LegExtension from '@/assets/illustrations/leg-extension.svg';
import LegPress from '@/assets/illustrations/leg-press.svg';
import Lunges from '@/assets/illustrations/lunges.svg';
import OverheadPress from '@/assets/illustrations/overhead-press.svg';
import Plank from '@/assets/illustrations/plank.svg';
import PullUps from '@/assets/illustrations/pull-ups.svg';
import PushUps from '@/assets/illustrations/push-ups.svg';
import RomanianDeadlift from '@/assets/illustrations/romanian-deadlift.svg';
import RowingMachine from '@/assets/illustrations/rowing-machine.svg';
import Running from '@/assets/illustrations/running.svg';
import RussianTwist from '@/assets/illustrations/russian-twist.svg';
import SeatedCableRow from '@/assets/illustrations/seated-cable-row.svg';
import SkullCrusher from '@/assets/illustrations/skull-crusher.svg';
import Squat from '@/assets/illustrations/squat.svg';
import Stretching from '@/assets/illustrations/stretching.svg';
import TricepPushdown from '@/assets/illustrations/tricep-pushdown.svg';

const illustrationMap: Record<string, FC<SvgProps>> = {
  'ab-crunch': AbCrunch,
  'barbell-curl': BarbellCurl,
  'barbell-row': BarbellRow,
  'bench-press': BenchPress,
  burpees: Burpees,
  'cable-crossover': CableCrossover,
  'calf-raise': CalfRaise,
  cycling: Cycling,
  deadlift: Deadlift,
  dips: Dips,
  'dumbbell-fly': DumbbellFly,
  'face-pull': FacePull,
  'front-raise': FrontRaise,
  'hammer-curl': HammerCurl,
  'hanging-leg-raise': HangingLegRaise,
  'incline-bench-press': InclineBenchPress,
  'jump-rope': JumpRope,
  'lateral-raise': LateralRaise,
  'lat-pulldown': LatPulldown,
  'leg-curl': LegCurl,
  'leg-extension': LegExtension,
  'leg-press': LegPress,
  lunges: Lunges,
  'overhead-press': OverheadPress,
  plank: Plank,
  'pull-ups': PullUps,
  'push-ups': PushUps,
  'romanian-deadlift': RomanianDeadlift,
  'rowing-machine': RowingMachine,
  running: Running,
  'russian-twist': RussianTwist,
  'seated-cable-row': SeatedCableRow,
  'skull-crusher': SkullCrusher,
  squat: Squat,
  stretching: Stretching,
  'tricep-pushdown': TricepPushdown,
};

interface ExerciseIllustrationProps {
  illustrationKey: string | null;
  size?: number;
}

export function ExerciseIllustration({ illustrationKey, size = 48 }: ExerciseIllustrationProps) {
  const SvgComponent = illustrationKey ? illustrationMap[illustrationKey] : null;

  return (
    <View
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: colors.bg.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {SvgComponent ? (
        <SvgComponent width={size * 0.7} height={size * 0.7} />
      ) : (
        <Dumbbell size={size * 0.5} color={colors.text.tertiary} strokeWidth={1.5} />
      )}
    </View>
  );
}
