export function getPackageRoute(pkg: string, version: string | null = null) {
  const [org, name] = pkg.startsWith('@') ? pkg.split('/') : [null, pkg]
  if (version) {
    return {
      name: 'package-version',
      params: { org, name, version },
    } as const
  }

  return {
    name: 'package',
    params: {
      org,
      name,
    },
  } as const
}
