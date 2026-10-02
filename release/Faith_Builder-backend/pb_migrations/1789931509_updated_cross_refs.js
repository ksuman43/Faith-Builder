/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
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

  // add field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "select976631240",
    "maxSelect": 0,
    "name": "rel_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "parallel",
      "prophecy",
      "quotation",
      "thematic"
    ]
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text18589324",
    "max": 0,
    "min": 0,
    "name": "notes",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1870716521")

  // remove field
  collection.fields.removeById("text1275018656")

  // remove field
  collection.fields.removeById("text1851555219")

  // remove field
  collection.fields.removeById("select976631240")

  // remove field
  collection.fields.removeById("text18589324")

  return app.save(collection)
})
