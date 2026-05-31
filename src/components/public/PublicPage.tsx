"use client";

import { animationEmoji, type LayoutProps, type Section } from "./shared";
import { Immersive } from "./layouts/Immersive";
import { Polaroid } from "./layouts/Polaroid";
import { Editorial } from "./layouts/Editorial";
import { Gallery } from "./layouts/Gallery";

type Props = {
  title:                string | null;
  recipient:            string | null;
  message:              string | null;
  relationshipStart:    string | null;
  photos:               string[];
  musicVideoId:         string | null;
  animationType:        string | null;
  animationCustomEmoji: string | null;
  layoutStyle:          string | null;
  sections:             Section[];
};

export function PublicPage(props: Props) {
  const shared: LayoutProps = {
    title:             props.title,
    recipient:         props.recipient,
    message:           props.message,
    relationshipStart: props.relationshipStart,
    photos:            props.photos,
    musicVideoId:      props.musicVideoId,
    emoji:             animationEmoji(props.animationType, props.animationCustomEmoji),
    sections:          props.sections,
  };

  switch (props.layoutStyle) {
    case "polaroid":  return <Polaroid  {...shared} />;
    case "editorial": return <Editorial {...shared} />;
    case "gallery":   return <Gallery   {...shared} />;
    case "immersive":
    default:          return <Immersive {...shared} />;
  }
}
