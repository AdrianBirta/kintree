import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, List, ListItemButton, ListItemAvatar, Avatar, ListItemText, TextField, IconButton,
  Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Autocomplete, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddCommentIcon from '@mui/icons-material/AddComment';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import Header from '../components/layout/Header';
import EmojiPicker from '../components/messaging/EmojiPicker';
import { messagingService, type ConversationSummary, type ChatMessage } from '../api/messagingService';
import { useAuth } from '../hooks/useAuth';

const POLL_INTERVAL = 6000; // NOU — polling la 6 secunde, atât pentru conversații cât și pentru mesaje

const conversationsKey = ['messaging', 'conversations'] as const;
const messagesKey = (id: string) => ['messaging', 'messages', id] as const;

// paletă de accente pentru avatare — alocată consistent per id, ca aceeași
// persoană să aibă mereu aceeași culoare, indiferent unde apare
const AVATAR_PALETTE = [
  ['#7c4dd4', '#9b72e0'], // mov
  ['#2f6fed', '#5b9bf5'], // albastru
  ['#2f9e6a', '#5cc596'], // verde
  ['#d99a3d', '#f0b968'], // portocaliu
  ['#d3324a', '#ec6b7f'], // roșu-roz
  ['#0e9aa7', '#3ec6d3'], // turcoaz
];

function avatarGradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [from, to] = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' · ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MessagesPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: conversationsKey,
    queryFn: messagingService.listConversations,
    refetchInterval: POLL_INTERVAL,
  });

  const { data: messages = [] } = useQuery({
    queryKey: activeConversationId ? messagesKey(activeConversationId) : ['messaging', 'messages', 'none'],
    queryFn: () => messagingService.getMessages(activeConversationId as string),
    enabled: !!activeConversationId,
    refetchInterval: POLL_INTERVAL,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => messagingService.sendMessage(activeConversationId as string, content),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: activeConversationId ? messagesKey(activeConversationId) : conversationsKey });
      queryClient.invalidateQueries({ queryKey: conversationsKey });
    },
  });

  useEffect(() => {
    if (activeConversationId) {
      messagingService.markAsRead(activeConversationId).catch(() => { });
    }
  }, [activeConversationId, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const conversationTitle = (c: ConversationSummary) => {
    if (c.isGroup) return c.name || c.participants.map((p) => p.firstName).join(', ');
    return c.participants[0] ? `${c.participants[0].firstName} ${c.participants[0].lastName}` : t('messages.unknown');
  };

  const conversationInitials = (c: ConversationSummary) => {
    const p = c.participants[0];
    return p ? `${p.firstName[0]}${p.lastName[0]}` : '?';
  };

  const conversationAvatarId = (c: ConversationSummary) => c.participants[0]?.id ?? c.id;

  // NOU — determină dacă ULTIMUL mesaj din conversația activă (dacă e al meu)
  // a fost citit de celălalt participant, comparând lastReadAt cu createdAt.
  // Doar 1:1 — pentru grupuri indicatorul de "văzut" per-persoană ar fi ambiguu,
  // așa că îl afișăm doar la conversațiile cu o singură altă persoană.
  const lastMessageSeen = useMemo(() => {
    if (!activeConversation || activeConversation.isGroup) return null;
    if (messages.length === 0) return null;
    const lastMine = [...messages].reverse().find((m) => m.senderId === user?.id);
    if (!lastMine) return null;
    const isReallyLast = messages[messages.length - 1].id === lastMine.id;
    if (!isReallyLast) return null;

    const other = activeConversation.participants[0];
    if (!other?.lastReadAt) return false;
    return new Date(other.lastReadAt).getTime() >= new Date(lastMine.createdAt).getTime();
  }, [activeConversation, messages, user?.id]);

  const handleSend = () => {
    if (!draft.trim() || !activeConversationId) return;
    sendMutation.mutate(draft.trim());
  };

  const handleEmojiSelect = (emoji: string) => {
    setDraft((prev) => prev + emoji);
    setEmojiAnchor(null);
    inputRef.current?.focus();
  };

  const showConversationList = !isMobile || !activeConversationId;
  const showChatPane = !isMobile || !!activeConversationId;

  return (
    <div className="h-dvh flex flex-col bg-earbore-grayLight">
      <Header />
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* ── listă de conversații ── */}
        {showConversationList && (
          <Box
            sx={{
              width: { xs: '100%', sm: 340 },
              borderRight: { sm: '1px solid' },
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'white',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, var(--color-earbore-600), var(--color-earbore-500))',
                color: 'white',
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{t('messages.title')}</Typography>
              <IconButton
                size="small"
                onClick={() => setNewChatOpen(true)}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
              >
                <AddCommentIcon fontSize="small" />
              </IconButton>
            </Box>

            {isLoadingConversations ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={22} /></Box>
            ) : conversations.length === 0 ? (
              <Box sx={{ px: 3, py: 5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">{t('messages.noConversations')}</Typography>
              </Box>
            ) : (
              <List sx={{ overflowY: 'auto', flex: 1, py: 1 }}>
                {conversations.map((c) => {
                  const isMine = c.lastMessage?.senderId === user?.id;

                  return (
                    <ListItemButton
                      key={c.id}
                      selected={c.id === activeConversationId}
                      onClick={() => setActiveConversationId(c.id)}
                      sx={{
                        mx: 1,
                        mb: 0.5,
                        borderRadius: 3,
                        '&.Mui-selected': {
                          bgcolor: 'var(--color-earbore-50)',
                          '&:hover': { bgcolor: 'var(--color-earbore-100)' },
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ background: avatarGradientFor(conversationAvatarId(c)), fontWeight: 700 }}>
                          {c.isGroup ? <GroupsIcon fontSize="small" /> : conversationInitials(c)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>
                            {conversationTitle(c)}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {isMine && c.lastMessage ? `${t('messages.you')}: ` : ''}
                            {c.lastMessage?.content ?? t('messages.noMessagesYet')}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        )}

        {/* ── fereastra de chat ── */}
        {showChatPane && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, bgcolor: '#faf8fd' }}>
            {!activeConversation ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-earbore-200), var(--color-earbore-400))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1,
                  }}
                >
                  <InsertEmoticonIcon sx={{ fontSize: 34, color: 'white' }} />
                </Box>
                <Typography color="text.secondary">{t('messages.selectConversation')}</Typography>
              </Box>
            ) : (
              <>
                {/* header conversație */}
                <Box
                  sx={{
                    p: 2, display: 'flex', alignItems: 'center', gap: 1.25,
                    background: 'linear-gradient(135deg, var(--color-earbore-600), var(--color-earbore-500))',
                    color: 'white',
                    boxShadow: '0 2px 12px -4px rgba(98,54,173,0.4)',
                  }}
                >
                  {isMobile && (
                    <IconButton size="small" onClick={() => setActiveConversationId(null)} sx={{ color: 'white' }}>
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Avatar sx={{ background: avatarGradientFor(conversationAvatarId(activeConversation)), border: '2px solid rgba(255,255,255,0.5)' }}>
                    {activeConversation.isGroup ? <GroupsIcon fontSize="small" /> : conversationInitials(activeConversation)}
                  </Avatar>
                  <Typography sx={{ fontWeight: 700 }}>{conversationTitle(activeConversation)}</Typography>
                </Box>

                {/* mesaje */}
                <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {messages.map((m: ChatMessage, idx) => {
                    const isMine = m.senderId === user?.id;
                    const prev = messages[idx - 1];
                    const showAvatar = !isMine && (!prev || prev.senderId !== m.senderId);
                    return (
                      <Box
                        key={m.id}
                        sx={{
                          display: 'flex',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end',
                          gap: 0.75,
                        }}
                      >
                        {!isMine && (
                          <Avatar
                            sx={{
                              width: 26, height: 26, fontSize: 11, fontWeight: 700,
                              background: avatarGradientFor(m.senderId),
                              visibility: showAvatar ? 'visible' : 'hidden',
                            }}
                          >
                            {m.sender.firstName[0]}{m.sender.lastName[0]}
                          </Avatar>
                        )}
                        <Box
                          sx={{
                            maxWidth: '68%',
                            px: 1.75,
                            py: 1,
                            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isMine
                              ? 'linear-gradient(135deg, var(--color-earbore-600), var(--color-earbore-500))'
                              : 'white',
                            color: isMine ? 'white' : 'var(--color-earbore-ink)',
                            boxShadow: isMine
                              ? '0 4px 14px -4px rgba(98,54,173,0.45)'
                              : '0 2px 8px -2px rgba(20,10,40,0.08)',
                            border: isMine ? 'none' : '1px solid var(--color-earbore-border)',
                          }}
                        >
                          {activeConversation.isGroup && !isMine && (
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', opacity: 0.75, mb: 0.25 }}>
                              {m.sender.firstName}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.45 }}>
                            {m.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block', textAlign: 'right', mt: 0.4, fontSize: 10.5,
                              opacity: isMine ? 0.8 : 0.55,
                            }}
                          >
                            {formatMessageTime(m.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}

                  {/* indicator "Văzut" — doar sub ultimul mesaj trimis de tine, în 1:1 */}
                  {lastMessageSeen !== null && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 0.5, mt: -0.25 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        {lastMessageSeen ? (
                          <DoneAllIcon sx={{ fontSize: 14, color: 'var(--color-earbore-500)' }} />
                        ) : (
                          <DoneIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        )}
                        <Typography variant="caption" sx={{ fontSize: 10.5, color: lastMessageSeen ? 'var(--color-earbore-600)' : 'text.disabled', fontWeight: 600 }}>
                          {lastMessageSeen ? t('messages.seen') : t('messages.sent')}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* input */}
                <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'white' }}>
                  <IconButton
                    size="small"
                    onClick={(e) => setEmojiAnchor(e.currentTarget)}
                    sx={{ color: 'var(--color-earbore-500)' }}
                  >
                    <InsertEmoticonIcon />
                  </IconButton>
                  <TextField
                    inputRef={inputRef}
                    size="small"
                    fullWidth
                    placeholder={t('messages.typePlaceholder')}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 999,
                        bgcolor: 'var(--color-earbore-grayLight)',
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleSend}
                    disabled={!draft.trim() || sendMutation.isPending}
                    sx={{
                      background: draft.trim() ? 'linear-gradient(135deg, var(--color-earbore-600), var(--color-earbore-500))' : undefined,
                      color: draft.trim() ? 'white' : undefined,
                      '&:hover': { background: draft.trim() ? 'linear-gradient(135deg, var(--color-earbore-700), var(--color-earbore-600))' : undefined },
                      '&.Mui-disabled': { bgcolor: 'var(--color-earbore-grayLight)' },
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>

                  <EmojiPicker
                    anchorEl={emojiAnchor}
                    onClose={() => setEmojiAnchor(null)}
                    onSelect={handleEmojiSelect}
                  />
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>

      {newChatOpen && (
        <NewConversationDialog
          onClose={() => setNewChatOpen(false)}
          onCreated={(id) => { setNewChatOpen(false); setActiveConversationId(id); }}
        />
      )}
    </div>
  );
};

const NewConversationDialog: React.FC<{ onClose: () => void; onCreated: (id: string) => void }> = ({ onClose, onCreated }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
  const [groupName, setGroupName] = useState('');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['messaging', 'contacts'],
    queryFn: messagingService.listContacts,
  });

  const createMutation = useMutation({
    mutationFn: () => messagingService.createConversation({
      participantIds: selected.map((c) => c.id),
      name: selected.length > 1 ? groupName || undefined : undefined,
    }),
    onSuccess: (conversation: any) => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      onCreated(conversation.id);
    },
  });

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('messages.newConversation')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">{t('messages.contactsHint')}</Typography>
        <Autocomplete
          multiple
          loading={isLoading}
          options={contacts}
          getOptionLabel={(c) => `${c.firstName} ${c.lastName}`}
          value={selected}
          onChange={(_, val) => setSelected(val)}
          renderValue={(value, getItemProps) =>
            value.map((option, index) => (
              <Chip {...getItemProps({ index })} key={option.id} label={`${option.firstName} ${option.lastName}`} size="small" />
            ))
          }
          renderInput={(params) => <TextField {...params} label={t('messages.selectContacts')} placeholder={t('memberDetail.searchPlaceholder')} />}
        />
        {selected.length > 1 && (
          <TextField
            size="small" label={t('messages.groupNameOptional')}
            value={groupName} onChange={(e) => setGroupName(e.target.value)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          disabled={selected.length === 0 || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          sx={{ background: 'linear-gradient(135deg, var(--color-earbore-600), var(--color-earbore-500))' }}
        >
          {createMutation.isPending ? t('common.saving') : t('messages.start')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessagesPage;