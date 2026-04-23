import { sanitizeFileName, unixToISO, isCLAUDEMD, isSkillDoc, skillFileName, buildRelativePath } from '../src/utils';

describe('sanitizeFileName', () => {
  test('replaces slashes and colons', () => {
    expect(sanitizeFileName('HR: Onboarding/Guide')).toBe('HR- Onboarding-Guide');
  });
  test('trims whitespace', () => {
    expect(sanitizeFileName('  About  ')).toBe('About');
  });
});

describe('unixToISO', () => {
  test('converts unix string to ISO', () => {
    expect(unixToISO('1700000000')).toBe('2023-11-14T22:13:20.000Z');
  });
});

describe('isCLAUDEMD', () => {
  test('matches exact title CLAUDE.md', () => {
    expect(isCLAUDEMD('CLAUDE.md')).toBe(true);
  });
  test('does not match other titles', () => {
    expect(isCLAUDEMD('About.md')).toBe(false);
  });
});

describe('isSkillDoc', () => {
  test('matches skill: prefix', () => {
    expect(isSkillDoc('skill: write-prd')).toBe(true);
  });
  test('does not match non-skill titles', () => {
    expect(isSkillDoc('About FCN')).toBe(false);
  });
});

describe('skillFileName', () => {
  test('extracts name after skill: prefix', () => {
    expect(skillFileName('skill: write-prd')).toBe('write-prd.md');
  });
  test('trims whitespace', () => {
    expect(skillFileName('skill:  my skill ')).toBe('my skill.md');
  });
});

describe('buildRelativePath', () => {
  test('builds path from parent path and title', () => {
    expect(buildRelativePath('2. HR', 'Onboarding')).toBe('2. HR/Onboarding.md');
  });
  test('returns root-level path when no parent', () => {
    expect(buildRelativePath('', 'About')).toBe('About.md');
  });
});
