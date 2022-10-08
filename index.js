// Create needed constants
// const list = document.querySelector('ul');
const list = document.querySelector('#list');
const titleInput = document.querySelector('#title');
const bodyInput = document.querySelector('#body');
const today = new Date().toLocaleDateString("en-US");
const form = document.querySelector('form');
// const submitBtn = document.querySelector('form button');
const submitBtn = document.querySelector('#save');


// Create an instance of a db object for us to store the open database in
let db;

// Open our database; it is created if it doesn't already exist
// (see the upgradeneeded handler below)
const openRequest = window.indexedDB.open('notes_db', 1);

// error handler signifies that the database didn't open successfully
openRequest.addEventListener('error', () => console.error('Database failed to open'));

// success handler signifies that the database opened successfully
openRequest.addEventListener('success', () => {
  console.log('Database opened succesfully');

  // Store the opened database object in the db variable. This is used a lot below
  db = openRequest.result;

  // Run the displayData() function to display the notes already in the IDB
  displayData();
});

// Set up the database tables if this has not already been done
openRequest.addEventListener('upgradeneeded', e => {

  // Grab a reference to the opened database
  db = e.target.result;

  // Create an objectStore to store our notes in (basically like a single table)
  // including a auto-incrementing key
  const objectStore = db.createObjectStore('notes_os', { keyPath: 'id', autoIncrement:true });

  // Define what data items the objectStore will contain
  objectStore.createIndex('title', 'title', { unique: false });
  objectStore.createIndex('body', 'body', { unique: false });
  objectStore.createIndex('date', 'date', { unique:false});

  console.log('Database setup complete');
});

// Create an submit handler so that when the form is submitted the addData() function is run
form.addEventListener('submit', addData);

// Define the addData() function
function addData(e) {
  // prevent default - we don't want the form to submit in the conventional way
  e.preventDefault();

  // grab the values entered into the form fields and store them in an object ready for being inserted into the DB
  const newItem = { title: titleInput.value, body: bodyInput.value, date: today };

  // open a read/write db transaction, ready for adding the data
  const transaction = db.transaction(['notes_os'], 'readwrite');

  // call an object store that's already been added to the database
  const objectStore = transaction.objectStore('notes_os');

  // Make a request to add our newItem object to the object store
  const addRequest = objectStore.add(newItem);

  addRequest.addEventListener('success', () => {
    // Clear the form, ready for adding the next entry
    titleInput.value = '';
    bodyInput.value = '';
  });

  // Report on the success of the transaction completing, when everything is done
  transaction.addEventListener('complete', () => {
    console.log('Transaction completed: database modification finished.');

    // update the display of data to show the newly added item, by running displayData() again.
    displayData();
  });

  transaction.addEventListener('error', () => console.log('Transaction not opened due to error'));
}

// Define the displayData() function
function displayData() {
  // Here we empty the contents of the list element each time the display is updated
  // If you ddn't do this, you'd get duplicates listed each time a new note is added
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  // Open our object store and then get a cursor - which iterates through all the
  // different data items in the store
  const objectStore = db.transaction('notes_os').objectStore('notes_os');
  objectStore.openCursor().addEventListener('success', e => {
    // Get a reference to the cursor
    const cursor = e.target.result;

    // If there is still another data item to iterate through, keep running this code
    if(cursor) {
      console.log(cursor);
      const card = document.createElement('div');
      card.setAttribute("class","card");
      list.appendChild(card);
      
      const card_body = document.createElement('div');
      card_body.setAttribute("class", "card-body");
      card.appendChild(card_body);
      
      const card_date = document.createElement('p');
      card_date.textContent = cursor.value.date;
      card_body.appendChild(card_date);

      const card_title = document.createElement('h5');
      card_title.setAttribute("class","card-title");
      card_title.textContent = cursor.value.title;
      card_body.appendChild(card_title);
      card.setAttribute('data-note-id', cursor.value.id);
      
      const card_text = document.createElement('p');
      card_text.setAttribute("class","card-text");
      card_text.textContent = cursor.value.body;
      card_body.appendChild(card_text);
      
      const delete_btn = document.createElement('button');
      delete_btn.setAttribute("class","btn btn-danger card-link");
      delete_btn.addEventListener("click",deleteItem);

      const trash = document.createElement('i');
      trash.setAttribute("class","bi bi-trash");
      delete_btn.appendChild(trash);
      card_body.appendChild(delete_btn);
      
      const share_btn = document.createElement('button');
      share_btn.setAttribute("class","btn btn-success card-link");
      card_body.appendChild(share_btn);

      const share_icon = document.createElement('i');
      share_icon.setAttribute('class','bi bi-share');
      share_btn.appendChild(share_icon);

      // Iterate to the next item in the cursor
      cursor.continue();
    } else {
      // Again, if list item is empty, display a 'No notes stored' message
      if(!list.firstChild) {
        const listItem = document.createElement('li');
        listItem.textContent = 'No notes stored.'
        list.appendChild(listItem);
      }
      // if there are no more cursor items to iterate through, say so
      console.log('Notes all displayed');
    }
  });
}

// Define the deleteItem() function
function deleteItem(e) {
  // retrieve the name of the task we want to delete. We need
  // to convert it to a number before trying it use it with IDB; IDB key
  // values are type-sensitive.
  const noteId = Number(e.target.parentNode.parentNode.parentNode.getAttribute('data-note-id'));

  // open a database transaction and delete the task, finding it using the id we retrieved above
  const transaction = db.transaction(['notes_os'], 'readwrite');
  const objectStore = transaction.objectStore('notes_os');
  const deleteRequest = objectStore.delete(noteId);

  // report that the data item has been deleted
  transaction.addEventListener('complete', () => {
    // delete the parent of the button
    // which is the list item, so it is no longer displayed
    e.target.parentNode.parentNode.parentNode.parentNode.removeChild(e.target.parentNode.parentNode.parentNode);
    console.log(`Note ${noteId} deleted.`);

    // Again, if list item is empty, display a 'No notes stored' message
    if(!list.firstChild) {
      const listItem = document.createElement('li');
      listItem.textContent = 'No notes stored.';
      list.appendChild(listItem);
    }
  });
}