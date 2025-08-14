
export const getSelectStyles = (isDark: boolean) => ({
  control: (base: any) => ({
    ...base,
    backgroundColor: isDark ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
    borderColor: isDark ? 'var(--border-secondary)' : 'var(--border-secondary)',
    boxShadow: 'none',
    minHeight: '42px',
    '&:hover': {
      borderColor: isDark ? 'var(--text-tertiary)' : 'var(--text-tertiary)',
    }
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: isDark ? 'var(--bg-secondary)' : 'var(--bg-primary)',
    border: `1px solid ${isDark ? 'var(--border-primary)' : 'var(--border-primary)'}`,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    zIndex: 9999,
  }),
  option: (base: any, { isFocused, isSelected }: any) => ({
    ...base,
    backgroundColor: isSelected
      ? 'var(--accent-primary)'
      : isFocused
        ? (isDark ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)')
        : 'transparent',
    color: isSelected
      ? 'var(--text-inverted)'
      : 'var(--text-primary)',
    '&:active': {
      backgroundColor: 'var(--accent-primary-hover)'
    }
  }),
  singleValue: (base: any) => ({
    ...base,
    color: 'var(--text-primary)'
  }),
  input: (base: any) => ({
    ...base,
    color: 'var(--text-primary)'
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
});