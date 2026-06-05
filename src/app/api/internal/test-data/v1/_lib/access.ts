export function isInternalTestDataMutationEnabled() {
  return process.env.NODE_ENV === "test"
    || process.env.INTERNAL_TEST_DATA_WRITE_ENABLED === "true";
}
