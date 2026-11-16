// @vitest-environment node
import {describe,expect,it} from 'vitest';
import {getExerciseAnimation,EXERCISE_ANIMATIONS} from '../app/_components/exercise-3d/exercises';
import {getExercisePose} from '../app/_components/exercise-3d/kinematics';
describe('generic canonical barbell row',()=>{it('preserves its identity and shares only the verified equivalent pronated motion',()=>{expect(getExerciseAnimation('00000000-0000-4000-8000-000000000122')).toBe('generic-bent-row');expect(getExerciseAnimation(null,'Remada Curvada')).toBe('generic-bent-row');expect(EXERCISE_ANIMATIONS['generic-bent-row'].name).toBe('Remada Curvada');for(const p of[0,.2,.4,.6,.8,1])expect(getExercisePose('generic-bent-row',p)).toEqual(getExercisePose('bent-row',p));});});
