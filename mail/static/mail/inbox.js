current_email_id = undefined;
current_mailbox = undefined;

document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // Add event listeners for reply, archive and unarchive
    document.querySelector('#reply').addEventListener('click', () => reply());
    document.querySelector('#archive').addEventListener('click', () => archive(true));
    document.querySelector('#unarchive').addEventListener('click', () => archive(false));

    // Send email
    document.querySelector('#compose-form').onsubmit = function () {
        /**
         * Sends email and then loads the sent mailbox
         */

        fetch('/emails', {
          method: 'POST',
          body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
          })
        })
            .then(response => response.json())
            .then(result => {
              console.log(result);
              // Load the sent mailbox
              load_mailbox('sent');
            })
            .catch(error => {
              console.log(error);
            });

    return false;
    };

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {
    /**
     * Displays the compose view and clears out the composition fields
     */

    // Show compose view and hide other views
    switch_view('none', 'none', 'block');

    // Clear out composition fields
    populate_composition_fields('', '', '');
}

function load_mailbox(mailbox) {
    /**
     * Displays the requested mailbox and fetches the emails in that mailbox
     */

    // Update current mailbox
    current_mailbox = mailbox;

    // Show the requested mailbox and hide other views
    switch_view('block', 'none', 'none');

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // fetch emails based on mailbox and add each email to view
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
          emails.forEach(add_email_to_view);
        });
}

function add_email_to_view(email) {
    /**
     * Adds email to view.
     * Creates a new div element for the email and adds a CSS class based on read/unread condition
     * Adds an event listener for displaying the email item
     */

    // Create div for email
    const row = document.createElement('div');
    row.innerHTML = `<a href='#' class='clickable'><span class='email-item-sender'>${email.sender}</span> ${email.subject} <span class='email-item-timestamp'>${email.timestamp}</span></a>`;

    // Add CSS class
    row.classList.add('email-item');
    if (email.read) {
      row.classList.add('email-item-read');
    }

    // Add event listener for displaying the email item
    row.addEventListener('click', () => display_email_item(email.id));

    // Add email to emails-view
    document.querySelector('#emails-view').append(row);
}

function display_email_item(id) {
    /**
     * Displays the email view
     * Fetches the requested email item based on email id
     * Hides Archive/Unarchive buttons if the current mailbox is sent. Otherwise, hide/show
     * Archive/Unarchive buttons based on the value of email.archived
     * Marks the email as read
     */

    // Update current_email_id
    current_email_id = id;

    // Reset the fields
    populate_email_fields('', '', '', '', '');

    // Show the email-view and hide other views
    switch_view('none', 'block', 'none');

    // Fetch the requested email item and populate the fields
    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
            populate_email_fields(email.sender, email.recipients, email.subject, email.timestamp, email.body);

            if (current_mailbox === 'sent') {
                // Hide Archive/Unarchive buttons if the current mailbox is sent
                document.querySelector('#archive').style.display = 'none';
                document.querySelector('#unarchive').style.display = 'none';
            }
            else if (email.archived) {
                // Hide Archive and show Unarchive if email is archived
                document.querySelector('#archive').style.display = 'none';
                document.querySelector('#unarchive').style.display = 'block';
            }
            else {
                // Show Archive and hide Unarchive if email is not archived
                document.querySelector('#archive').style.display = 'block';
                document.querySelector('#unarchive').style.display = 'none';
            }
          });

    // Mark the email as read
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });
}

function reply() {
    /**
     * First Calls compose_email to display the composition form
     * Then fetches the email item based on current_email_id to populate the fields
     */

    compose_email();

    // Fetch the requested email item
    fetch(`/emails/${current_email_id}`)
        .then(response => response.json())
        .then(email => {
            // Prefix the email subject with 'Re: '
            let subject = email.subject;
            if (subject.slice(0, 4) !== 'Re: ') {
                subject = 'Re: ' + subject;
            }

            // Populate the fields
            populate_composition_fields(email.sender, subject,
                `\n\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`);
        });
}

function archive(flag) {
    /**
     * Fetches the email item based on current_email_id and modifies the archived property based on the value of flag
     * Then loads the inbox
     */

    // Fetch the email item based on current_email_id and modify the archived property
    fetch(`/emails/${current_email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: flag
        })
    })
        .then( () => {
            load_mailbox('inbox');
        });
}

function switch_view(emails, email, compose) {
    /**
     * Shows/hides views
     */

    document.querySelector('#emails-view').style.display = emails;
    document.querySelector('#email-view').style.display = email;
    document.querySelector('#compose-view').style.display = compose;
}

function populate_composition_fields(recipients, subject, body) {
    /**
     * Populates composition fields
     */

    document.querySelector('#compose-recipients').value = recipients;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
}

function populate_email_fields(from, to, subject, timestamp, body) {
    /**
     * Populates email fields
     */

    document.querySelector('#from').innerHTML = from;
    document.querySelector('#to').innerHTML = to;
    document.querySelector('#subject').innerHTML = subject;
    document.querySelector('#timestamp').innerHTML = timestamp;
    document.querySelector('#body').innerHTML = body;
}