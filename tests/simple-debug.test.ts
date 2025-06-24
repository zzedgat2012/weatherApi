console.log('SIMPLE DEBUG TEST: This message should appear in test output');

describe('Simple Console Test', () => {
  beforeAll(() => {
    console.log('SIMPLE DEBUG TEST: beforeAll called');
  });

  it('should show console output', () => {
    console.log('SIMPLE DEBUG TEST: test case executed');
    expect(true).toBe(true);
  });
});
