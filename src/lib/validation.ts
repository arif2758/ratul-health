// Form validation utilities
export interface ValidationError {
  field: string;
  message: string;
}

export const validateMetricsForm = (data: {
  weight?: string;
  height?: string;
  age?: string;
  waist?: string;
  neck?: string;
  hip?: string;
  gender?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.weight || parseFloat(data.weight) <= 0) {
    errors.push({ field: "weight", message: "Weight must be greater than 0" });
  }

  if (!data.height || parseFloat(data.height) <= 0) {
    errors.push({ field: "height", message: "Height must be greater than 0" });
  }

  if (!data.age || parseInt(data.age) < 1 || parseInt(data.age) > 150) {
    errors.push({
      field: "age",
      message: "Age must be between 1 and 150",
    });
  }

  if (!data.gender) {
    errors.push({ field: "gender", message: "Please select a gender" });
  }

  return errors;
};

export const validateGoalForm = (data: {
  targetWeight?: string;
  targetBodyFat?: string;
  dailyCalorieGoal?: string;
  targetDate?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (data.targetWeight && parseFloat(data.targetWeight) <= 0) {
    errors.push({
      field: "targetWeight",
      message: "Target weight must be greater than 0",
    });
  }

  if (
    data.targetBodyFat &&
    (parseFloat(data.targetBodyFat) < 0 || parseFloat(data.targetBodyFat) > 100)
  ) {
    errors.push({
      field: "targetBodyFat",
      message: "Body fat percentage must be between 0 and 100",
    });
  }

  if (data.dailyCalorieGoal && parseFloat(data.dailyCalorieGoal) <= 0) {
    errors.push({
      field: "dailyCalorieGoal",
      message: "Daily calorie goal must be greater than 0",
    });
  }

  return errors;
};
