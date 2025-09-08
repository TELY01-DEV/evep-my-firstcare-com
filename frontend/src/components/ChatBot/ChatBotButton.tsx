import React, { useState } from 'react';
import {
  Fab,
  Badge,
  Tooltip,
  Zoom,
} from '@mui/material';
import {
  Chat,
  SmartToy,
  Close,
} from '@mui/icons-material';
import ChatBotInterface from './ChatBotInterface';

interface ChatBotButtonProps {
  initialMessage?: string;
}

const ChatBotButton: React.FC<ChatBotButtonProps> = ({ initialMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Zoom in={!isOpen}>
        <Tooltip title="Ask EVEP Assistant / ถามผู้ช่วย EVEP" placement="left">
          <Fab
            color="primary"
            aria-label="chat bot"
            onClick={handleOpen}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <Badge
              color="error"
              variant="dot"
              invisible={!hasNewMessage}
            >
              <SmartToy />
            </Badge>
          </Fab>
        </Tooltip>
      </Zoom>

      <ChatBotInterface
        isOpen={isOpen}
        onClose={handleClose}
        initialMessage={initialMessage}
      />
    </>
  );
};

export default ChatBotButton;
