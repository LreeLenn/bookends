hydrate = 'username,tasks=[challenge=[name,votes=summary,categories=summary]]'

hydrate = [
  'username'
  'tasks.challenge.name'
  'tasks.challenge.categories=summary'

  'tasks=[challenge=[name,votes=summary,categories=summary]]'
]

hydrate = [
  'username' # simple column directly on the model
  {
    relation: 'tasks'
    hydrate: [
      {
        relation: 'challenge'
        hydrate: [
          'name'
          { relation: 'votes', hydrate: 'summary' }
          { relation: 'categories', hydrate: 'summary' }
        ]
      }
    ]
  }
]



get('user', hydrate).then (result) ->

get = (tableName, where, hydrate) ->

get = (Model, where, hydrateSpec) ->
  new Model(where)

  Model.where(where).fetch(
    withRelated: buildRelated(hydrateSpec)
  # withRelated: ['comments.tags', 'comments.author', {
  #   'author': function(qb) {
  #     qb.where('status', 'active')
  #   }
  # }]
  }).then(...
