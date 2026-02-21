const isDefined = (value) =>
  value !== null && value !== undefined;

const isObject = (value) =>
  isDefined(value) &&
  typeof value === "object" &&
  !Array.isArray(value);

const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

const isPositiveNumber = (value) =>
  isFiniteNumber(value) && value > 0;

const isNonNegativeNumber = (value) =>
  isFiniteNumber(value) && value >= 0;

const isInteger = (value) =>
  Number.isInteger(value);


const isIntegerNumber = (value) =>
  isFiniteNumber(value) && isInteger(value);

const isValidAdultAge = (value) =>
  isIntegerNumber(value) && value >= 18 && value <= 100;

const isValidString = (value) =>
  typeof value === "string" && value.trim().length > 0;


const typeRegistry = {
  string:      isValidString,
  object:      isObject,
  integer:     isIntegerNumber,  
  positive:    isFiniteNumber,  
  nonNegative: isFiniteNumber,  
  adultAge:    isIntegerNumber,
  boolean:     (v) => typeof v === "boolean",  
};

const valueRegistry = {
  positive:    isPositiveNumber,    
  nonNegative: isNonNegativeNumber,
  adultAge:    isValidAdultAge,     
};

const validateBySchema = (
  data,
  schema,
  objectPath = "",
  errors = [],
  stopOnFirstError = false
) => {
  if (!isObject(data)) {
    errors.push({
      path: objectPath || "root",
      code: "INVALID_OBJECT",
      message: `${objectPath || "root"} must be a valid object`
    });
    return errors;
  }

  const fieldErrors = new Set();

  const allowedFields = Object.entries(schema)
    .filter(([_, rules]) => !rules.virtual)
    .map(([field]) => field);


  for (const key of Object.keys(data)) {
    if (!allowedFields.includes(key)) {
      errors.push({
        path: objectPath || "root",
        code: "UNKNOWN_FIELD",
        message: `${objectPath || "root"}: Unknown field "${key}" is not allowed`
      });
      if (stopOnFirstError) return errors;
    }
  }

  for (const [field, rules] of Object.entries(schema)) {
    const fullPath = objectPath ? `${objectPath}.${field}` : field;
    const value    = data[field];

   
    if (rules.virtual) {
      if (rules.custom && !fieldErrors.has(field)) {
        const hasDependencyError = rules.dependsOn?.some(dep =>
          fieldErrors.has(dep)
        );
        if (!hasDependencyError) {
          const customError = rules.custom(undefined, data);
          if (customError) {
            errors.push({
              path: fullPath,
              code: "CUSTOM_VALIDATION",
              message: customError
            });
            fieldErrors.add(field);
            if (stopOnFirstError) return errors;
          }
        }
      }
      continue; 
    }

    // Required check
    if (rules.required && !isDefined(value)) {
      errors.push({
        path: fullPath,
        code: "REQUIRED",
        message: `${fullPath} is required`
      });
      fieldErrors.add(field);
      if (stopOnFirstError) return errors;
      continue;
    }

    if (!isDefined(value)) continue;

    // Type check → INVALID_TYPE
    if (rules.type && typeRegistry[rules.type]) {
      if (!typeRegistry[rules.type](value)) {
        errors.push({
          path: fullPath,
          code: "INVALID_TYPE",
          message: `${fullPath} must be a valid ${rules.type}`
        });
        fieldErrors.add(field);
        if (stopOnFirstError) return errors;
        continue; // ← type failed, skip value check
      }
    }


    if (rules.type && valueRegistry[rules.type]) {
      if (!valueRegistry[rules.type](value)) {
        errors.push({
          path: fullPath,
          code: "INVALID_VALUE",
          message: `${fullPath} has an invalid value: ${value}`
        });
        fieldErrors.add(field);
        if (stopOnFirstError) return errors;
        continue;
      }
    }

    // Min check
    if (rules.min !== undefined && isFiniteNumber(value) && value < rules.min) {
      errors.push({
        path: fullPath,
        code: "MIN_VALUE",
        message: `${fullPath} must be at least ${rules.min}`
      });
      fieldErrors.add(field);
      if (stopOnFirstError) return errors;
      continue;
    }

    // Nested schema
    if (rules.schema && isObject(value)) {
      const resolvedSchema =
        typeof rules.schema === "function"
          ? rules.schema(value)
          : rules.schema;
      validateBySchema(value, resolvedSchema, fullPath, errors, stopOnFirstError);
      if (stopOnFirstError && errors.length) return errors;
    }

    // Custom validation
    if (rules.custom && !fieldErrors.has(field)) {
      const hasDependencyError = rules.dependsOn?.some(dep =>
        fieldErrors.has(dep)
      );
      if (!hasDependencyError) {
        const customError = rules.custom(value, data);
        if (customError) {
          errors.push({
            path: fullPath,
            code: "CUSTOM_VALIDATION",
            message: customError
          });
          fieldErrors.add(field);
          if (stopOnFirstError) return errors;
        }
      }
    }
  }

  return errors;
};

module.exports = {
validateBySchema,
};

