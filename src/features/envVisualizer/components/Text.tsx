import { KonvaEventObject } from 'konva/lib/Node';
import React, { RefObject } from 'react';
import { Group, Label as KonvaLabel, Tag as KonvaTag, Text as KonvaText } from 'react-konva';

import EnvVisualizer from '../EnvVisualizer';
import { Config, ShapeDefaultProps } from '../EnvVisualizerConfig';
import { Layout } from '../EnvVisualizerLayout';
import { Data, Hoverable, Visible } from '../EnvVisualizerTypes';
import { getTextWidth, setHoveredCursor, setUnhoveredCursor } from '../EnvVisualizerUtils';
import { Frame } from './Frame';

export interface TextOptions {
  maxWidth: number;
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  fontVariant: string;
  isStringIdentifiable: boolean;
}

export const defaultOptions: TextOptions = {
  maxWidth: Number.MAX_VALUE, // maximum width this text should be
  fontFamily: Config.FontFamily.toString(), // default is Arial
  fontSize: Number(Config.FontSize), // in pixels. Default is 12
  fontStyle: Config.FontStyle.toString(), // can be normal, bold, or italic. Default is normal
  fontVariant: Config.FontVariant.toString(), // can be normal or small-caps. Default is normal
  isStringIdentifiable: false // if true, contain strings within double quotation marks "". Default is false
};

/** this class encapsulates a string to be drawn onto the canvas */
export class Text implements Visible, Hoverable {
  private _height: number;
  private _width: number;
  private _hoveredWidth: number;

  readonly partialStr: string; // truncated string representation of data
  readonly fullStr: string; // full string representation of data

  readonly options: TextOptions = defaultOptions;
  ref: RefObject<any> = React.createRef();
  private _x: number;
  private _y: number;
  readonly frame?: Frame;

  constructor(
    readonly data: Data,
    x: number,
    y: number,
    /** additional options (for customization of text) */
    options: Partial<TextOptions> = {},
    frame?: Frame
  ) {
    this._x = x;
    this._y = y;
    this.frame = frame;
    this.options = { ...this.options, ...options };

    const { fontSize, fontStyle, fontFamily, maxWidth, isStringIdentifiable } = this.options;

    this.fullStr = this.partialStr = isStringIdentifiable
      ? JSON.stringify(data) || String(data)
      : String(data);
    this._height = fontSize;

    const widthOf = (s: string) => getTextWidth(s, `${fontStyle} ${fontSize}px ${fontFamily}`);
    this._hoveredWidth = widthOf(this.partialStr);
    if (this._hoveredWidth > maxWidth) {
      let truncatedText = Config.Ellipsis.toString();
      let i = 0;
      while (widthOf(this.partialStr.substr(0, i) + Config.Ellipsis.toString()) < maxWidth) {
        truncatedText = this.partialStr.substr(0, i++) + Config.Ellipsis.toString();
      }
      this._width = widthOf(truncatedText);
      this.partialStr = truncatedText;
    } else {
      this._width = Math.max(Config.TextMinWidth, widthOf(this.partialStr));
    }
  }
  x(): number {
    return this._x;
  }
  y(): number {
    return this._y;
  }
  height(): number {
    return this._height;
  }
  width(): number {
    return this._width;
  }
  hoveredWidth(): number {
    return this._hoveredWidth;
  }
  updatePosition = (x: number, y: number) => {
    this._x = x;
    this._y = y;
  };

  onMouseEnter = ({ currentTarget }: KonvaEventObject<MouseEvent>) => {
    if (EnvVisualizer.getPrintableMode()) return;
    setHoveredCursor(currentTarget);
    this.ref.current.moveToTop();
    this.ref.current.show();
    currentTarget.getLayer()?.draw();
  };

  onMouseLeave = ({ currentTarget }: KonvaEventObject<MouseEvent>) => {
    if (EnvVisualizer.getPrintableMode()) return;
    setUnhoveredCursor(currentTarget);
    this.ref.current.hide();
    currentTarget.getLayer()?.draw();
  };

  draw(): React.ReactNode {
    const props = {
      fontFamily: this.options.fontFamily,
      fontSize: this.options.fontSize,
      fontStyle: this.options.fontStyle,
      fill: EnvVisualizer.getPrintableMode()
        ? Config.SA_BLUE.toString()
        : Config.SA_WHITE.toString()
    };
    return (
      <Group key={Layout.key++} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <KonvaLabel x={this.x()} y={this.y()}>
          <KonvaText {...ShapeDefaultProps} key={Layout.key++} text={this.partialStr} {...props} />
        </KonvaLabel>
        <KonvaLabel
          x={this._x}
          y={this._y}
          ref={this.ref}
          visible={EnvVisualizer.getPrintableMode() ? true : false}
          listening={false}
        >
          <KonvaTag
            {...ShapeDefaultProps}
            fill={EnvVisualizer.getPrintableMode() ? 'white' : 'black'}
            opacity={0.5}
            listening={false}
          />
          <KonvaText
            {...ShapeDefaultProps}
            key={Layout.key++}
            text={this.fullStr}
            {...props}
            listening={false}
          />
        </KonvaLabel>
      </Group>
    );
  }
}
