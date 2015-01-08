## Step 1: Install Everything

```javascript
npm install --save knex bookshelf bookends
```

## Step 2: Create Your Bookshelf.js Models

Bookends lives on top of [Bookshelf.js](http://bookshelfjs.org), which is an ORM for Node.js. You will need to set up your Bookshelf models before using Bookends.

For detailed instructions on this, checkout the [Bookshelf.js website](http://bookshelfjs.org). Here is a quick rundown, using the database found in the [demo](demo.html) as an example:

```javascript
var knex = require('knex')({
  client: 'pg', // or mysql or sqlite3
  connection: {
    host: 'localhost',
    user: 'your_user',
    password: 'your_password',
    database: 'your_database'
  }
});

var bookshelf = require('bookshelf')(knex);

var Author = bookshelf.Model.extend({
  tableName: 'authors',
  books: function() {
    return this.hasMany(Book, 'author_id');
  }
});

var Subject = bookshelf.Model.extend({
  tableName: 'subjects',
  books: function() {
    return this.hasMany(Book, 'subject_id');
  }
});

var Book = bookshelf.Model.extend({
  tableName: 'books',
  author: function() {
    return this.belongsTo(Author, 'author_id');
  },
  subject: function() {
    return this.belongsTo(Subject, 'subject_id');
  }
});
```

## Step 3: Create a Bookends Instance

For starters, a default instance will do.

```javascript
var Bookends = require('bookends');
var bookends = new Bookends();
```

<div class="alert alert-info">
Bookends instances are very lightweight and maintain almost no state. Creating different instances for different use cases is a good approach, especially when you start using many different custom aggregations (see below).
</div>

## Step 4: Start Hydrating Data

Now with your models and bookends in hand, you can begin to query your data:

```javascript
bookends.hydrate(Author, '[first_name,last_name]').then(function(result) {
  // result is an object
  // result.count --> how many records came back
  // result.records --> array of your records
  console.log(result.records[0].first_name);
});
```
### Different Ways To Hydrate Data

#### Columns: `[column1,column2]`

The simplest hydration involves columns on the model you are querying, like in the above example where `first_name` and `last_name` were specified. This results in

```sql
select first_name, last_name from authors
```

Notice the columns are wrapped in `[]`, this is required. Everything inside of `[` and `]` indicate what you are retrieving at that level of the hydration.

<div class="alert alert-info">
Passing <code>[*]</code> as your hydration works as expected. It will retrieve all columns.
</div>

#### Relations: `[someRelation=[column1,column2]]`

To grab a relation that is under your current model, specify the relation name followed by `=`, then what you want hydrated in that relation.

<div class="alert alert-danger">
You need to specify the relation name that you set on your Bookshelf model, <b>not</b> the table name.
</div>

For example, using the demo database, we could do

```javascript
bookends.hydrate(Author, '[books=[title]]')
```

Returning all the titles for all the books, grouped under their author.

#### Aggregations: `[someRelation=someAggregation(someParameter)]`

You can aggregate related data by specifying an aggregation instead of columns. For example, to see how many books each author has:

```javascript
bookends.hydrate(Author, '[books=count]')
```

Instead of an array of books for each author, you will get back an object that looks like `{count: 2}`.

<div class="alert alert-danger">
Aggregations do not take place in the database, a minor ding against Bookends. Instead the related records are returned to memory, and Bookends aggregates them after the fact.
</div>

so far there are three built in aggregations:

* **count**: `[books=count]` - returns the count of the child relation
* **sum**: `[books=sum(price)]` - returns the sum of the child relation, where the specified column (in this case `price`) is summed. The column must be numeric.
* **collect**: `[books=collect(title)]` - gathers the specified column into an array.

## Custom Aggregations

You can create custom aggregations too. To do so, pass in the custom aggregation when creating your bookends instance.

For example, here is a recreation of the built in `collect`:

```javascript
var config = {
  aggregations: {
    myCollect: {
      hydration: function(spec) {
        return spec.aggregation.params;
      },
      aggregate: function(records, spec) {
        return _.pluck(records, spec.aggregation.params[0])
      }
    }
  }
};

var bookends = new Bookends(config);

// notice the "custom." prefix, this is required
bookends.hydrate(Author, '[books=custom.myCollect(title)]').then(...);
```

`hydration()` receives a `spec` parameter, which is simply what the user entered parsed out into an object. For example, `[books=custom.myCollect(title)]` would result in `hydrate()` receiving this object:

```javascript
{
  relation: 'books',
  aggregation: {
    method: 'myCollect',
    params: ['title']
  }
}
```

`hydrate()` tells Bookends what data the aggregation needs. You can return a hydration string, or an array of columns. So in this case, the parameters to the aggregation doubly work as the hydration.

`aggregate()` receives an array of the records that were hydrated, as well as that same spec object again. It is up to `aggregate()` to perform the actual aggregation. Whatever `aggregate()` returns is what will end up in the final data result.

For example, in the above, the final result will look like:

```javascript
{
  // the array of Author records
  records: [
    // instead of arrays of actual book records, each books property
    // is instead the "plucking" that the aggregation did
    { books: ['title1', 'title2', 'etc']},
    { books: ['title3', 'title4', 'etc']},
    { books: ['title5', 'title6', 'etc']}
  ]
}
```

## Where Clauses, Sorting, Limits, etc

You can further fine tune the query by passing an additional options object to hydrate. See the [API docs](docs.html) for the gory details.

### orderBy
Sort the root level records by a column.

```javascript
var options = {
  orderBy: ['last_name', 'DESC']
};
bookends.hydrate(Author, options, '[first_name,last_name]')
```


### where
Add a where clause to the root SQL query.

```javascript
var options = {
  where: [
    ['first_name', 'like', 'Edg%'],
    { last_name: 'Poe'}
  ]
};
bookends.hydrate(Author, options, '[first_name,last_name]')
```

### single
causes only the first record to come back. Instead of an object with `count` and `records` property, the result is just a single record object

```javascript
var options = {
  single: true
};
bookends.hydrate(Author, options, '[*]').then(function(record) {
  console.log(record.first_name);
});
```

`null` is returned if no record is found.

### limit and offset

limits and offsets the number of records returned, useful for paging

```javascript
var options = {
  limit: 50,
  offset: 100
};

bookends.hydrate(Author, options, '[*]').then(function(result) {
  // the first 100 authors are skipped, then the next 50 are returned
  console.log(result.count); // 50
  console.log(result.offset); // 100
});
```

`offset` is always returned, so if you do not specify it, then it will be `0`.

### totalCount

Have Bookends perform one more query to get the total count of rows. An additional `totalCount` property is added to the result.

```javascript
var options = {
  totalCount: true
};


bookends.hydrate(Author, options, '[*]').then(function(result) {
  console.log(result.totalCount); // count of all the rows in the authors table
});
```

**NOTE:** if `totalCount` is used in conjunction with a where clause, that where clause is also used to calculate totalCount.
