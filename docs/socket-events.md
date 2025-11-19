# Socket event contract

## Connection

- The client must include the authenticated user ID as `id` inside `socket.handshake.query` when establishing the connection (`io(URL, { query: { id: userId } })`).

## Events emitted by the server

- `unread-message-count`

  - Payload: `{ unreadCount: number }`
  - Emitted immediately after the user joins their private room so the navbar can display the number of pending messages.

- `user-status`
  - Payload: `{ userId: string, online: boolean }`
  - Emitted each time a user connects or disconnects so the profile view can show whether an artist/user is online.

Clients should listen for these events and update the UI accordingly (e.g., refresh the navbar badge, toggle the online indicator on the artist profile). Use a local map of user statuses to avoid repeated requests when displaying lists of profiles.
