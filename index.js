$(document).ready(function(){
  // Create needed constants
  const list = document.querySelector('#list');
  const titleInput = document.querySelector('#title');
  const bodyInput = document.querySelector('#body');

  const today = new Date().toLocaleDateString("en-US");

  // Create an instance of a db object for us to store the open database in
  let db;
  let cat = "digital";

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
  // form.addEventListener('submit', addData);

  $("#save").click(function(){
    if(document.getElementById("body").value == '')
    {
        alert("Answer is empty. Not saved.");
        return false;
    }
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
      // titleInput.value = '';
      // bodyInput.value = '';
    });

    // Report on the success of the transaction completing, when everything is done
    transaction.addEventListener('complete', () => {
      console.log('Transaction completed: database modification finished.');
      // update the display of data to show the newly added item, by running displayData() again.
      // displayData();
      // $("#refresh").click();
    });

    transaction.addEventListener('error', () => console.log('Transaction not opened due to error'));
  });

  function displayData() {
    // empty #list
    // $("#list").empty();
    const objectStore = db.transaction('notes_os').objectStore('notes_os');
    objectStore.openCursor().addEventListener('success', e => {
      // Get a reference to the cursor
      const cursor = e.target.result;

      // If there is still another data item to iterate through, keep running this code
      if(cursor) {
        var $elem = $("#list");
        $elem.prepend(
          $('<div/>',{'class':'card','data-note-id':cursor.value.id}).append(
            $('<div/>',{'class':'card-body'}).append(
              $('<p/>',{'text':cursor.value.date,'class':'small text-muted'})
            ).append(
              $('<h6/>',{'text':cursor.value.title})
            ).append(
              $('<hr>')
            ).append(
              $('<p/>',{'text':cursor.value.body})
            ).append(
              $('<hr>')
            ).append(
              $('<button/>',{'class':'btn btn-light btn-sm card-link','note-id':cursor.value.id,'style':'color:red'}).append(
                $('<i/>',{'class':'bi bi-trash'})
              )
            // ).append(
            //   $('<button/>',{'class':'btn btn-secondary btn-sm card-link'}).append(
            //     $('<i/>',{'class':'bi bi-share'})
            //   )
            )
          )
        )
        // Iterate to the next item in the cursor
        cursor.continue();
      }
    });
  }

// delete note
  $(document).on('click', "[note-id]", function(){
    if(confirm("Confirm to delete!")){
      var i = Number($(this).attr('note-id'));
      const transaction = db.transaction(['notes_os'], 'readwrite');
      const objectStore = transaction.objectStore('notes_os');
      const deleteRequest = objectStore.delete(i);
      $("[data-note-id='"+i+"']").remove();
    } else {
      return false;
    }
  });
  
  function getQuestions(){
    $.getJSON("https://dvbondoy.github.io/yournal/questions.json", function(data) {
      let obj = Object.keys(data);
      rnd = Math.floor(Math.random() * obj.length);
      $("#title").val(data[rnd]);
    });
  }
  
  function getQuest(){
    $.getJSON("https://dvbondoy.github.io/yournal/quest.json", function(data) {
      let obj = Object.keys(data[cat]);
      // console.log(obj);
      rnd = Math.floor(Math.random() * obj.length);
      $("#title").val(data[cat][rnd]);
    });
  }


  $("#reset").click(function(){
    $("#body").val("");
    getQuest();
  });
  
  $("#identities").change(function(){
    if(this.value == 'cog') {
      window.open('cdt.html','_blank');
      return false;
    }
    
    cat = this.value;
    $("#reset").click();
    // console.log(cat);
  });
  
  getQuest();
});