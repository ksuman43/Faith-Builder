/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1870716521")

  // remove field
  collection.fields.removeById("text1275018656")

  // remove field
  collection.fields.removeById("text1851555219")

  // add field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1283443574",
    "help": "",
    "hidden": false,
    "id": "relation1275018656",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "source_verse",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1283443574",
    "help": "",
    "hidden": false,
    "id": "relation1851555219",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "target_verse",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1870716521")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1275018656",
    "max": 0,
    "min": 0,
    "name": "source_verse",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text1851555219",
    "max": 0,
    "min": 0,
    "name": "target_verse",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("relation1275018656")

  // remove field
  collection.fields.removeById("relation1851555219")

  return app.save(collection)
})
