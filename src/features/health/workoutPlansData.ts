export interface WorkoutExercise {
  name: string;
  muscle: string;
  sets: string;
  reps: string;
  notes?: string;
  emoji: string;
}

export interface WorkoutDayPlan {
  dayName: string;
  focus: string;
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutRoutinePlan {
  id: string;
  name: string;
  tagline: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  daysPerWeek: number;
  badge: string;
  icon: string;
  colorClass: string;
  borderClass: string;
  isCustom?: boolean;
  days: WorkoutDayPlan[];
}

export const STORAGE_CUSTOM_PLANS_KEY = 'shadow_custom_workout_plans_v1';

export function getCustomWorkoutPlans(): WorkoutRoutinePlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PLANS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading custom workout plans:', e);
  }
  return [];
}

export function saveCustomWorkoutPlan(plan: WorkoutRoutinePlan): WorkoutRoutinePlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getCustomWorkoutPlans();
    const filtered = existing.filter(p => p.id !== plan.id);
    const updated = [plan, ...filtered];
    localStorage.setItem(STORAGE_CUSTOM_PLANS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving custom workout plan:', e);
    return [];
  }
}

export function deleteCustomWorkoutPlan(planId: string): WorkoutRoutinePlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getCustomWorkoutPlans();
    const updated = existing.filter(p => p.id !== planId);
    localStorage.setItem(STORAGE_CUSTOM_PLANS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting custom workout plan:', e);
    return [];
  }
}

export const WORKOUT_PLANS: WorkoutRoutinePlan[] = [
  {
    id: 'ppl_split',
    name: 'Push • Pull • Legs (PPL)',
    tagline: 'The gold standard bodybuilding routine for maximum hypertrophy and muscle volume.',
    level: 'Intermediate',
    daysPerWeek: 6,
    badge: 'Hypertrophy King',
    icon: '🏋️‍♂️',
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    days: [
      {
        dayName: 'Day 1 • Push (Chest/Delts/Triceps)',
        focus: 'Chest & Shoulder Pressing Focus',
        estimatedMinutes: 55,
        exercises: [
          { name: 'Barbell Flat Bench Press', muscle: 'Chest', sets: '4', reps: '6-8', emoji: '🏋️', notes: 'Heavy progressive overload' },
          { name: 'Incline Dumbbell Press', muscle: 'Upper Chest', sets: '3', reps: '8-10', emoji: '💪', notes: '30-degree bench incline' },
          { name: 'Overhead Dumbbell Press', muscle: 'Front Deltoids', sets: '3', reps: '8-10', emoji: '⚡', notes: 'Strict form, full ROM' },
          { name: 'Dumbbell Lateral Raises', muscle: 'Side Deltoids', sets: '4', reps: '12-15', emoji: '🦅', notes: 'Control the eccentric' },
          { name: 'Tricep Rope Pushdown', muscle: 'Triceps', sets: '3', reps: '10-12', emoji: '⛓️', notes: 'Flare rope at the bottom' },
        ],
      },
      {
        dayName: 'Day 2 • Pull (Back/Biceps/Rear Delts)',
        focus: 'Back Thickness & Lat Width',
        estimatedMinutes: 55,
        exercises: [
          { name: 'Conventional Barbell Deadlift', muscle: 'Back & Posterior', sets: '3', reps: '5', emoji: '🧱', notes: 'Brace core tightly' },
          { name: 'Wide-Grip Lat Pulldown', muscle: 'Upper Lats', sets: '4', reps: '8-10', emoji: '🧗', notes: 'Drive elbows into ribs' },
          { name: 'Seated Cable Row', muscle: 'Mid-Back', sets: '3', reps: '10-12', emoji: '🚣', notes: 'Squeeze shoulder blades' },
          { name: 'Face Pulls with Rope', muscle: 'Rear Delts', sets: '4', reps: '15', emoji: '🏹', notes: 'Shoulder health staple' },
          { name: 'Incline Dumbbell Bicep Curls', muscle: 'Biceps', sets: '3', reps: '10-12', emoji: '💪', notes: 'Deep stretch at bottom' },
        ],
      },
      {
        dayName: 'Day 3 • Legs & Core',
        focus: 'Quad Drive & Posterior Chain',
        estimatedMinutes: 50,
        exercises: [
          { name: 'Barbell Back Squat', muscle: 'Quads & Glutes', sets: '4', reps: '6-8', emoji: '🦵', notes: 'Hit parallel depth' },
          { name: 'Romanian Deadlift (RDL)', muscle: 'Hamstrings & Glutes', sets: '3', reps: '8-10', emoji: '🪶', notes: 'Hinge hips backwards' },
          { name: 'Dumbbell Walking Lunges', muscle: 'Quads & Stability', sets: '3', reps: '10 / leg', emoji: '🚶', notes: 'Controlled tempo' },
          { name: 'Standing Calf Raises', muscle: 'Calves', sets: '4', reps: '15', emoji: '🦶', notes: 'Pause 2s at the peak' },
          { name: 'Hanging Leg Raises', muscle: 'Core / Abs', sets: '3', reps: '12-15', emoji: '🛡️', notes: 'Avoid swinging momentum' },
        ],
      },
    ],
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower Power Split',
    tagline: 'Balanced 4-day frequency maximizing compound strength and natural athletic density.',
    level: 'Beginner',
    daysPerWeek: 4,
    badge: 'Strength & Density',
    icon: '⚡',
    colorClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/30',
    days: [
      {
        dayName: 'Upper Body A • Heavy Strength',
        focus: 'Heavy Horizontal Push & Pull',
        estimatedMinutes: 50,
        exercises: [
          { name: 'Barbell Incline Bench Press', muscle: 'Upper Chest', sets: '4', reps: '6', emoji: '🏋️' },
          { name: 'Weighted / Bodyweight Pull-Ups', muscle: 'Lats & Back', sets: '4', reps: '6-8', emoji: '🧗' },
          { name: 'Standing Overhead Barbell Press', muscle: 'Shoulders', sets: '3', reps: '6-8', emoji: '⚡' },
          { name: 'Chest Supported Dumbbell Rows', muscle: 'Rhomboids', sets: '3', reps: '10', emoji: '🚣' },
          { name: 'Overhead Tricep Extension & DB Curls', muscle: 'Arms Superset', sets: '3', reps: '12', emoji: '💪' },
        ],
      },
      {
        dayName: 'Lower Body A • Quad Dominant',
        focus: 'Squats & Knee Flexion',
        estimatedMinutes: 50,
        exercises: [
          { name: 'Barbell Back Squats', muscle: 'Quads', sets: '4', reps: '6-8', emoji: '🦵' },
          { name: 'Romanian Deadlifts', muscle: 'Hamstrings', sets: '3', reps: '8-10', emoji: '🪶' },
          { name: 'Leg Press', muscle: 'Quads / Glutes', sets: '3', reps: '12', emoji: '🚜' },
          { name: 'Lying Hamstring Curls', muscle: 'Hamstrings', sets: '3', reps: '12-15', emoji: '🎯' },
          { name: 'Seated Calf Raises', muscle: 'Soleus', sets: '4', reps: '15', emoji: '🦶' },
        ],
      },
    ],
  },
  {
    id: 'cardio_hiit',
    name: 'Cardio, HIIT & Metabolic Shred',
    tagline: 'High calorie burn protocol designed for fast conditioning, VO2 max, and rapid fat oxidation.',
    level: 'Beginner',
    daysPerWeek: 4,
    badge: 'Fat Burn OS',
    icon: '🔥',
    colorClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    days: [
      {
        dayName: 'HIIT Sprints & Explosive Core',
        focus: 'Anaerobic Sprint Intervals & Core',
        estimatedMinutes: 40,
        exercises: [
          { name: 'Treadmill Incline Sprints', muscle: 'Cardiovascular', sets: '10 intervals', reps: '30s on / 60s off', emoji: '🏃' },
          { name: 'Kettlebell Swings', muscle: 'Hips & Posterior', sets: '4', reps: '20', emoji: '🔔' },
          { name: 'Burpees with Jump', muscle: 'Full Body', sets: '4', reps: '12', emoji: '💥' },
          { name: 'Plank with Shoulder Taps', muscle: 'Core Stability', sets: '3', reps: '45 sec', emoji: '🛡️' },
        ],
      },
      {
        dayName: 'Zone 2 Steady Endurance & Rucking',
        focus: 'Fat Oxidation & Mitochondrial Density',
        estimatedMinutes: 45,
        exercises: [
          { name: 'Incline Treadmill Walk (12% inc, 4.5 km/h)', muscle: 'Heart & Glutes', sets: '1', reps: '30 mins', emoji: '⛰️' },
          { name: 'Rowing Machine Steady Pace', muscle: 'Lats & Legs', sets: '1', reps: '15 mins', emoji: '🚣' },
          { name: 'Hollow Body Hold & Deadbug', muscle: 'Deep Transverse Abs', sets: '3', reps: '15 reps', emoji: '🧘' },
        ],
      },
    ],
  },
  {
    id: 'calisthenics_flow',
    name: 'Bodyweight Mastery & Calisthenics',
    tagline: 'Relative strength, gymnastic progressions, and functional shoulder & hip mobility.',
    level: 'Intermediate',
    daysPerWeek: 3,
    badge: 'Ninja Strength',
    icon: '🧘',
    colorClass: 'text-teal-400',
    borderClass: 'border-teal-500/30',
    days: [
      {
        dayName: 'Upper Calisthenics Flow',
        focus: 'Bodyweight Leverage & Hollow Body',
        estimatedMinutes: 45,
        exercises: [
          { name: 'Strict Hollow Body Pull-Ups', muscle: 'Lats & Core', sets: '4', reps: '8-12', emoji: '🧗' },
          { name: 'Parallel Bar Dips', muscle: 'Chest & Triceps', sets: '4', reps: '10-15', emoji: '⚡' },
          { name: 'Pike Push-ups (Handstand Prep)', muscle: 'Shoulders', sets: '3', reps: '8-10', emoji: '🤸' },
          { name: 'Diamond Push-ups', muscle: 'Inner Chest & Triceps', sets: '3', reps: '15', emoji: '💎' },
          { name: 'L-Sit / Tuck L-Sit Hold', muscle: 'Core & Hip Flexors', sets: '4', reps: '20-30 sec', emoji: '🛡️' },
        ],
      },
    ],
  },
];
