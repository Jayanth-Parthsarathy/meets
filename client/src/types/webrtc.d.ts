export interface ExtendedRTCPeerConnection extends RTCPeerConnection {
  targetUserId: number;
  targetUserName: string;
}
