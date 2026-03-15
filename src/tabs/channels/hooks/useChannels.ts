import { useState, useEffect, useCallback } from 'react'
import type { Channel } from '../../../types'
import { channelService } from '../../../services/channel.service'

export const useChannels = () => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)

  const fetchChannels = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await channelService.getAll()
      setChannels(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channels')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createChannel = useCallback(
    async (data: Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await channelService.create(data)
      await fetchChannels()
      setSelectedChannel(created)
      return created
    },
    [fetchChannels]
  )

  const updateChannel = useCallback(
    async (id: string, data: Partial<Channel>) => {
      const updated = await channelService.update(id, data)
      await fetchChannels()
      setSelectedChannel(updated)
      return updated
    },
    [fetchChannels]
  )

  const deleteChannel = useCallback(
    async (id: string) => {
      await channelService.delete(id)
      if (selectedChannel?.id === id) {
        setSelectedChannel(null)
      }
      await fetchChannels()
    },
    [fetchChannels, selectedChannel]
  )

  const selectChannel = useCallback((channel: Channel | null) => {
    setSelectedChannel(channel)
  }, [])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  return {
    channels,
    isLoading,
    error,
    selectedChannel,
    selectChannel,
    fetchChannels,
    createChannel,
    updateChannel,
    deleteChannel
  }
}
