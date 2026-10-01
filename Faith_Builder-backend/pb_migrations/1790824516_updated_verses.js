/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1283443574")

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2170393721",
    "help": "",
    "hidden": false,
    "id": "relation3170058525",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "abbreviation",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1283443574")

  // remove field
  collection.fields.removeById("relation3170058525")

  return app.save(collection)
})
