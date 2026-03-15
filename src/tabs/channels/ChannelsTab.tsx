import { useState } from 'react'
import { Plus, Tv } from 'lucide-react'
import { useChannels } from './hooks/useChannels'
import { ChannelCard } from './ChannelCard'
import { ChannelDetail } from './ChannelDetail'
import { CreateChannelModal } from './CreateChannelModal'
import { useToast } from '../../hooks/useToast'
import type { Channel } from '../../types'

export const ChannelsTab = () => {
  const {
    channels,
    isLoading,
    selectedChannel,
    selectChannel,
    createChannel,
    updateChannel,
    deleteChannel
  } = useChannels()

  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)

  const handleCreate = async (
    data: Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    await createChannel(data)
    toast('Channel created successfully', 'success')
  }

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel)
    setModalOpen(true)
  }

  const handleUpdate = async (
    data: Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!editingChannel) return
    await updateChannel(editingChannel.id, data)
    toast('Channel updated successfully', 'success')
  }

  const handleDelete = async (id: string) => {
    await deleteChannel(id)
    toast('Channel deleted', 'info')
  }

  const openCreateModal = () => {
    setEditingChannel(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingChannel(null)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-text-primary">
          YouTube Channels
        </h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus size={16} />
          Add Channel
        </button>
      </div>

      {/* Body: two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — channel list */}
        <div className="w-80 shrink-0 overflow-auto border-r border-border p-3">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-text-secondary">Loading...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface">
                <Tv size={24} className="text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  No channels yet
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Create your first channel to get started
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                <Plus size={14} />
                Create Channel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {channels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isSelected={selectedChannel?.id === channel.id}
                  onSelect={selectChannel}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel — detail or empty state */}
        <div className="flex-1 overflow-hidden">
          {selectedChannel ? (
            <ChannelDetail
              channel={selectedChannel}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Tv
                  size={40}
                  className="mx-auto mb-3 text-text-secondary/30"
                />
                <p className="text-sm text-text-secondary">
                  Select a channel to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <CreateChannelModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={editingChannel ? handleUpdate : handleCreate}
        editChannel={editingChannel}
      />
    </div>
  )
}
