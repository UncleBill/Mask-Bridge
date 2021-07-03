import { useCallback, useEffect, useMemo, useState } from 'react';
import { storage } from 'utils';

export const useLocalState = (
  initialValue,
  key,
  { valueType = 'string', isStoredImmediately = false } = {},
) => {
  const storageValue = useMemo(() => storage.get(key), [key]);
  const castedValue = useMemo(() => {
    if (valueType === 'number') {
      return parseInt(storageValue, 10);
    }
    if (valueType === 'boolean') {
      return storageValue === 'true';
    }
    if (valueType === 'object') {
      return JSON.parse(storageValue);
    }
    return storageValue;
  }, [storageValue, valueType]);

  const [value, setValue] = useState(castedValue || initialValue);

  const updateValue = useCallback(
    (val, shouldBeStored = false) => {
      const result = typeof val === 'function' ? val(value) : val;
      if (JSON.stringify(result) !== JSON.stringify(value)) {
        setValue(result);
      }
      if ((!!isStoredImmediately || !!shouldBeStored) && !!key) {
        storage.set(key, result);
      }
    },
    [key, value, isStoredImmediately],
  );

  useEffect(() => {
    updateValue(value);
  }, [key, value, updateValue]);

  useEffect(() => {
    if (!!key && !storageValue) {
      storage.set(key, initialValue);
    }
  }, [key, initialValue, storageValue]);

  return [value, updateValue, castedValue];
};
