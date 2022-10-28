import { useState, useEffect } from "react";

import styled from "styled-components";
import Head from "next/head";

import { SpotifyPlayingData } from "../types/gateway";
import { gateway } from "../utils/gateway";
import { millisToMinutesAndSeconds } from "../utils/functions";

export default function Home() {
  const [song, setSong] = useState<Partial<SpotifyPlayingData>>({
    playing: false,
  });

  useEffect(() => {
    const listener = (data: SpotifyPlayingData) => {
      setSong((state) => {
        return { ...state, ...data };
      });
    };

    gateway.on("spotify", listener);
    gateway.on("spotify_changed", listener);

    return () => {
      gateway.removeListener("spotify", listener);
      gateway.removeListener("spotify_changed", listener);
    };
  }, []);

  return (
    <Container>
      <Head>
        <title>Spotify Overlay</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {!!song.playing && (
        <>
          <Cover playing height="100" src={song.image} />
          <TrackInfo>
            <TrackTitle>{song.name}</TrackTitle>
            <TrackArtist>
              {song.artists.map(({ name }) => name).join(", ")}
            </TrackArtist>

            <ProgressContainer>
              <Timer>
                {millisToMinutesAndSeconds(song.progress)} :{" "}
                {millisToMinutesAndSeconds(song.length)}
              </Timer>
              <Progress>
                <ProgressBar progress={(song.progress / song.length) * 100} />
              </Progress>
            </ProgressContainer>

            <DeviceInfo>
              {song.type == "Smartphone" ? "📱" : "💻"} {song.name}
            </DeviceInfo>
          </TrackInfo>
        </>
      )}
    </Container>
  );
}

const Cover = styled.img`
  visibility: ${(props: { playing?: boolean }) =>
    !props.playing ? "hidden" : "visible"};
  width: ${(props: { playing?: boolean }) =>
    !props.playing ? "0px" : "100px"};
  height: ${(props: { playing?: boolean }) =>
    !props.playing ? "0px" : "100px"};
  margin-right: ${(props: { playing?: boolean }) =>
    !props.playing ? "0px" : "10px"};

  background-size: auto;
  padding: 5px;
  transition: all;
  border-radius: 10px;
`;

const TrackInfo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;

  padding-top: 5px;
  margin-bottom: 10px;
`;

const TrackTitle = styled.span`
  font-size: 18px;
`;

const TrackArtist = styled.span`
  font-size: 12px;
`;

const Progress = styled.div`
  border-radius: 10px;
  width: 100%;
  height: 5px;
  background-color: darkslategrey;
`;

const ProgressContainer = styled.div`
  padding-top: 5px;
  width: 220px;
`;

const ProgressBar = styled.div`
  height: 5px;
  border-radius: 10px;
  background-color: lightblue;
  color: black;
  width: ${(props: { progress: number }) =>
    props.progress ? `${props.progress}%` : "0%"};
  transition: width 1000ms linear;
`;

const DeviceInfo = styled.span`
  font-size: 10px;

  display: flex;
  position: absolute;
  padding-bottom: 10px;

  bottom: 0;
`;

const Timer = styled.span`
  font-size: 12px;
  padding-bottom: 3px;
  display: flex;
`;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  position: absolute;

  padding: 5px;

  right: 0;
  bottom: 0;
  left: 0;
`;
