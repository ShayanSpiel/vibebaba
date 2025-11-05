/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)

  // Fix projects collection permissions
  const projects = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")
  projects.listRule = "userId = @request.auth.id || userId = null || userId = \"\""
  projects.viewRule = "userId = @request.auth.id || userId = null || userId = \"\""
  projects.createRule = "@request.auth.id != \"\" || @request.auth.id = null || @request.auth.id = \"\""
  projects.updateRule = "userId = @request.auth.id || userId = null || userId = \"\""
  projects.deleteRule = "userId = @request.auth.id || userId = null || userId = \"\""
  dao.saveCollection(projects)

  // Fix project_files collection permissions
  const projectFiles = dao.findCollectionByNameOrId("13m6f2nrprkemu0")
  projectFiles.listRule = "projectId.userId = @request.auth.id || projectId.userId = null || projectId.userId = \"\""
  projectFiles.viewRule = "projectId.userId = @request.auth.id || projectId.userId = null || projectId.userId = \"\""
  projectFiles.createRule = "projectId.userId = @request.auth.id || projectId.userId = null || projectId.userId = \"\""
  projectFiles.updateRule = "projectId.userId = @request.auth.id || projectId.userId = null || projectId.userId = \"\""
  projectFiles.deleteRule = "projectId.userId = @request.auth.id || projectId.userId = null || projectId.userId = \"\""
  dao.saveCollection(projectFiles)

  // Fix token_usage collection permissions
  const tokenUsage = dao.findCollectionByNameOrId("kujyt4j1fn3e06i")
  tokenUsage.listRule = "userId = @request.auth.id"
  tokenUsage.viewRule = "userId = @request.auth.id"
  tokenUsage.createRule = "@request.auth.id != \"\""
  tokenUsage.updateRule = null
  tokenUsage.deleteRule = null
  dao.saveCollection(tokenUsage)

  // Fix transactions collection permissions
  const transactions = dao.findCollectionByNameOrId("enas9xyp7294ewu")
  transactions.listRule = "@request.auth.id != \"\" && userId = @request.auth.id"
  transactions.viewRule = "@request.auth.id != \"\" && userId = @request.auth.id"
  transactions.createRule = "@request.auth.id != \"\" && userId = @request.auth.id"
  transactions.updateRule = null
  transactions.deleteRule = null
  return dao.saveCollection(transactions)
}, (db) => {
  const dao = new Dao(db)

  // Revert projects collection permissions
  const projects = dao.findCollectionByNameOrId("qs1lgj8vbwnkacp")
  projects.listRule = "userId = @request.auth.id || userId = null || userId = \"\""
  projects.viewRule = "userId = @request.auth.id || userId = null || userId = \"\""
  projects.createRule = null
  projects.updateRule = "userId = @request.auth.id || userId = null || userId = \"\""
  projects.deleteRule = "userId = @request.auth.id || userId = null || userId = \"\""
  dao.saveCollection(projects)

  // Revert project_files collection permissions
  const projectFiles = dao.findCollectionByNameOrId("13m6f2nrprkemu0")
  projectFiles.listRule = null
  projectFiles.viewRule = null
  projectFiles.createRule = null
  projectFiles.updateRule = null
  projectFiles.deleteRule = null
  dao.saveCollection(projectFiles)

  // Revert token_usage collection permissions
  const tokenUsage = dao.findCollectionByNameOrId("kujyt4j1fn3e06i")
  tokenUsage.listRule = "userId = @request.auth.id"
  tokenUsage.viewRule = "userId = @request.auth.id"
  tokenUsage.createRule = null
  tokenUsage.updateRule = null
  tokenUsage.deleteRule = null
  dao.saveCollection(tokenUsage)

  // Revert transactions collection permissions
  const transactions = dao.findCollectionByNameOrId("enas9xyp7294ewu")
  transactions.listRule = "@request.auth.id != \"\" && userId = @request.auth.id"
  transactions.viewRule = "@request.auth.id != \"\" && userId = @request.auth.id"
  transactions.createRule = null
  transactions.updateRule = "@request.auth.id = \"\""
  transactions.deleteRule = "@request.auth.id = \"\""
  return dao.saveCollection(transactions)
})
