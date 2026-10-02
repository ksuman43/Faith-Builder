/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4282183725")

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "select2371146282",
    "maxSelect": 0,
    "name": "source_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "messages",
      "book",
      "email",
      "article",
      "devotional",
      "other"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4282183725")

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "select2371146282",
    "maxSelect": 0,
    "name": "source_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "messages",
      "book",
      "email",
      "article",
      "other"
    ]
  }))

  return app.save(collection)
})
