import { PERMISSION_IDS, permissionGroups } from './permissionsId'

export const getPermissionCategories = (permissions) => {
  if (!permissions || !Array.isArray(permissions)) return {}

  // Create a mapping from the permissionGroups
  const groupedPermissions = {}

  permissionGroups.forEach((group) => {
    const activePermissions = group.permissions.filter((perm) => permissions.includes(perm.id))

    if (activePermissions.length > 0) {
      groupedPermissions[group.name] = {}
      activePermissions.forEach((perm) => {
        groupedPermissions[group.name][perm.name] = perm.id
      })
    }
  })

  return groupedPermissions
}

export { PERMISSION_IDS, permissionGroups }
