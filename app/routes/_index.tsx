import type { MetaFunction } from "@remix-run/node";
import { useState, useEffect, useRef } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Peer to Peer Audio" },
    { name: "description", content: "Peer to Peer Audio Streaming" },
  ];
};

export default function Index() {
  const [isCalling, setIsCalling] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun.stunprotocol.org",
          "stun:stun.l.google.com:19302",
        ],
      },
    ],
  };

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initializeMedia();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCall = async () => {
    setIsCalling(true);
    peerConnectionRef.current = new RTCPeerConnection(servers);

    localStream?.getTracks().forEach((track) => {
      peerConnectionRef.current?.addTrack(track, localStream);
    });

    peerConnectionRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current.onicecandidate = async (event) => {
      if (event.candidate) {
        // Send the candidate to the remote peer
        console.log("New ICE candidate:", event.candidate);
      }
    };

    // Create offer
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    // Send offer to remote peer (this is a placeholder - in a real app, you'd use a signaling server)
    console.log("Offer created:", offer);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Peer-to-Peer Audio Streaming</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold">Local</h2>
          <video ref={localVideoRef} autoPlay muted className="w-64 h-48 bg-gray-200" />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold">Remote</h2>
          <video ref={remoteVideoRef} autoPlay className="w-64 h-48 bg-gray-200" />
        </div>
      </div>
      <button
        onClick={startCall}
        disabled={isCalling}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isCalling ? "Calling..." : "Start Call"}
      </button>
    </div>
  );
}
