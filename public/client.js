
$(document).ready(function () {
   /* Global io*/
  let socket = io();
  /*
  socket.on('user count', function (data) {
    console.log(data);
  });*/
  
  //#21
  socket.on('user', data => {
  $('#num-users').text(data.currentUsers + ' users online');
    let message =
      data.name +
      (data.connected ? ' has joined the chat.' : ' has left the chat.');
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });
  
  //#22
  socket.on('chat message', (data) => {
    console.log('socket.on 1');
    $('#messages').append($('<li>').text(`${data.name}: ${data.message}`));
  });
  
  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    // Send message to server here?
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
});
