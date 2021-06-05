import BasicLayout from '..';
import renderer from 'react-test-renderer';

describe('Layout: BasicLayout', () => {
  it('Render correctly', () => {
    expect(typeof window !== 'undefined').toBe(false);
  });
});
