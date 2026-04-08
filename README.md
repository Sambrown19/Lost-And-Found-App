
# Lost and Found App

A React Native mobile application for reporting lost and found items with real-time messaging capabilities, built for Pentecost University students.

## Features

### Authentication
- Email/Password registration with university email validation (@pentvars.edu.gh)
- Email verification with Appwrite
- Complete profile setup after registration
- Secure session management

### Item Management
- Report lost or found items
- Upload multiple images per item
- Search items by title, category, or location
- Filter by Lost/Found/Recent tabs
- Image carousel with thumbnail navigation
- View item details with full description

### Messaging System
- Real-time messaging between users
- Conversation history with unread indicators
- Read receipts for messages
- Item context in conversations
- Profile avatars with random colors

### User Experience
- Skeleton loaders for all screens
- Search history with local storage
- Pull to refresh on conversations
- Responsive design for all devices
- Smooth animations and transitions

## Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: Expo Router (File-based routing)
- **Backend**: Appwrite (BaaS)
- **Database**: Appwrite Database
- **Storage**: Appwrite Storage
- **Authentication**: Appwrite Auth
- **Icons**: Expo Vector Icons
- **Storage**: AsyncStorage

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Appwrite instance (cloud or self-hosted)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Sambrown19/Lost-And-Found-App.git
cd Lost-And-Found-App
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file:
  see .env.example

4. Start the development server:
```bash
npx expo start
```

## Project Structure

```
app/
├── (auth)/          # Authentication screens
│   ├── login.tsx
│   ├── signup.tsx
│   ├── email-verification.tsx
│   ├── email-verified.tsx
│   └── complete-profile.tsx
├── (tabs)/          # Main tab navigation
│   ├── home.tsx     # Feed screen
│   ├── conversations.tsx
│   └── account.tsx
├── chat/            # Chat screens
│   └── [id].tsx
├── item/            # Item detail
│   └── [id].tsx
├── report-lost.tsx  # Report lost item
├── report-found.tsx # Report found item
└── _layout.tsx      # Root navigation

components/          # Reusable components
├── loader/          # Skeleton loaders
└── ItemCard.tsx

services/            # API services
├── itemsService.ts
├── messagesService.ts
└── userService.ts

config/              # App configuration
└── appwrite.ts

constants/           # App constants
└── Colors.ts
```

## Database Collections

### Items Collection
| Field | Type | Description |
|-------|------|-------------|
| title | string | Item title |
| description | string | Item description |
| category | string | Item category |
| location | string | Where lost/found |
| images | string[] | Array of image URLs |
| type | string | 'lost' or 'found' |
| status | string | 'active' or 'resolved' |
| userId | string | Owner's user ID |
| userName | string | Owner's name |

### Conversations Collection
| Field | Type | Description |
|-------|------|-------------|
| participants | string[] | Array of user IDs |
| participantNames | string | Comma-separated names |
| lastMessage | string | Last message text |
| lastMessageTime | datetime | Timestamp |
| unreadCount | number | Unread messages count |
| itemId | string | Related item ID |
| itemTitle | string | Item title |

### Messages Collection
| Field | Type | Description |
|-------|------|-------------|
| conversationId | string | Parent conversation |
| senderId | string | Sender's user ID |
| receiverId | string | Receiver's user ID |
| message | string | Message content |
| read | boolean | Read status |
| createdAt | datetime | Timestamp |

## Environment Setup

1. Create an Appwrite project
2. Create database with collections above
3. Create storage bucket for images
4. Update `.env` with your credentials
5. Configure email verification in Appwrite console

## 📱 Running the App

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Troubleshooting

### Common Issues

2. **Images not uploading**
   - Verify storage bucket permissions
   - Check file size limits

3. **Conversations not showing**
   - Ensure participants array is properly formatted
   - Check that current user ID matches

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Authors

- Samuel Duodu Sampson - Initial work

## Acknowledgments

- Pentecost University for the domain email requirement
- Appwrite for backend services
- Expo team for the framework

## Support

For issues or questions:
- Create an issue on GitHub
- Contact: duodusammy1@gmail.com



---

**Made with ❤️ for Pentecost University students**
```
