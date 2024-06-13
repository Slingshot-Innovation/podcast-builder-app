'use client'
import { useState, useEffect, useRef } from "react"
import { Sheet, SheetTrigger, SheetContent } from "../components/ui/sheet"
import { Button } from "../components/ui/button"
import Link from "next/link"
import { createEpisode, getEpisodes, getEpisodeDetails } from "./actions"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Spinner } from "../components/ui/spinner" 
import { Separator } from "../components/ui/separator"

export default function Component() {
  const [episodeRes, setEpisodeRes] = useState(null)
  const [query, setQuery] = useState("")
  const [episodeLength, setEpisodeLength] = useState(30)
  const [episodes, setEpisodes] = useState([])
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [clips, setClips] = useState([])
  const [currentClipIndex, setCurrentClipIndex] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)  // Loading state
  const audioRef = useRef(null)

  useEffect(() => {
    fetchEpisodes()
  }, [])

  useEffect(() => {
    if (selectedEpisode) {
      fetchEpisodeDetails(selectedEpisode.id)
    }
  }, [selectedEpisode])

  useEffect(() => {
    const handleTimeUpdate = () => {
      if (!audioRef.current) return
      const currentTime = audioRef.current.currentTime
      let cumulativeTime = 0

      for (let i = 0; i < clips.length; i++) {
        cumulativeTime += clips[i].length
        if (currentTime < cumulativeTime) {
          setCurrentClipIndex(i)
          break
        }
      }
    }

    const audio = audioRef.current
    if (audio) {
      audio.addEventListener("timeupdate", handleTimeUpdate)
      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate)
      }
    }
  }, [clips])

  async function handleCreateEpisode() {
    setIsLoading(true)  // Set loading state to true
    const response = await createEpisode({ query: query, episodeLength: (episodeLength * 60) })
    console.log(response)
    setEpisodeRes(response)
    fetchEpisodes() // Refresh the episodes list
    setIsDialogOpen(false) // Close the dialog
    setSelectedEpisode(response.episode) // Automatically select the newly created episode
    setIsLoading(false)  // Set loading state to false
  }

  async function fetchEpisodes() {
    const { data, error } = await getEpisodes()
    if (error) {
      console.error(error)
      return
    }
    setEpisodes(Array.isArray(data) ? data : [])
    // setSelectedEpisode(data[0])
  }

  async function fetchEpisodeDetails(episodeId) {
    const { data, error } = await getEpisodeDetails(episodeId)
    if (error) {
      console.error(error)
      return
    }
    setSelectedEpisode(data.episode)
    setClips(data.clips.map((clip, index) => ({
      ...clip,
      startTime: index === 0 ? 0 : data.clips.slice(0, index).reduce((acc, cur) => acc + cur.length, 0),
      endTime: data.clips.slice(0, index + 1).reduce((acc, cur) => acc + cur.length, 0)
    })))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleClipClick = (startTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime
      audioRef.current.play()
    }
  }

  return (
    <div className="flex w-full max-w-6xl mx-auto">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8 m-4">
            <MenuIcon className="w-5 h-5" />
            <span className="sr-only">Open episodes sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="flex flex-col gap-4 py-2 data-[collapsed=true]:py-2">
            <nav className="grid gap-1 px-2">
              {episodes.map((episode) => (
                <Button
                  key={episode.id}
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2"
                  asChild
                  onClick={() => setSelectedEpisode(episode)}
                >
                  <Link href="#">
                    <VideoIcon className="w-4 h-4" />
                    {episode.title}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 w-full p-4 md:p-6">
        <div className="rounded-lg overflow-hidden relative">
          <audio
            ref={audioRef}
            className="w-full"
            controls
            src={selectedEpisode?.audio_url}
          />
          <div className="p-4">
            <h2 className="text-xl font-bold">{selectedEpisode?.title}</h2>
            <p className="text-gray-700 dark:text-gray-400 mt-2">
              {selectedEpisode?.description}
            </p>
            <Button variant="ghost" size="icon" className="w-8 h-8 mt-4">
              <HeartIcon className="w-5 h-5" />
            </Button>
          </div>
          <Separator />
          <div className="p-4">
            <div className="flex items-center gap-2 mt-2">
              <PlayIcon className="w-6 h-6" />
              <div className="flex-1">
                <h4 className="font-medium line-clamp-1">{clips[currentClipIndex]?.title}</h4>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTime(clips[currentClipIndex]?.startTime)} - {formatTime(clips[currentClipIndex]?.endTime)}
                </div>
                <p>{clips[currentClipIndex]?.description}</p>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <ForwardIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-lg border dark:border-gray-800 overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Clips</h3>
          </div>
          <div className="divide-y dark:divide-gray-800">
            {clips.map((clip, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-4 ${index === currentClipIndex
                  ? "bg-gray-200 dark:bg-gray-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  } cursor-pointer`}
                onClick={() => handleClipClick(clip.startTime)}
              >
                <div className="flex-1">
                  <h4 className="font-medium line-clamp-1">{clip.title}</h4>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="fixed top-4 right-4">
            <PlusIcon className="w-4 h-4 mr-2" />
            Create
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new episode</DialogTitle>
            <DialogDescription>Enter the details for the new episode.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center grid-cols-4 gap-4">
              <Label htmlFor="query" className="text-right">
                New episode
              </Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="col-span-3"
              />
              <Label htmlFor="query" className="text-right">
                Length
              </Label>
              <Input
                id="episodeLength"
                value={episodeLength}
                onChange={(e) => setEpisodeLength(e.target.value)}
                type="number"
                placeholder={30}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateEpisode} disabled={isLoading}>
              {isLoading ? <Spinner className="w-4 h-4 mr-2" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {episodeRes && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-4 rounded-md shadow-lg">
          {episodeRes.message}
        </div>
      )}
    </div>
  );
}


function CalendarIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}


function ForwardIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 17 20 12 15 7" />
      <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
  )
}


function HeartIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}


function MenuIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}


function PlayIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  )
}


function RewindIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 19 2 12 11 5 11 19" />
      <polygon points="22 19 13 12 22 5 22 19" />
    </svg>
  )
}


function SettingsIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function PlusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

function VideoIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  )
}


function Volume2Icon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}
