// lib/messaging/message-builder.ts
/**
 * MESSAGE BUILDER (Builder Pattern)
 *
 * For custom messages not covered by MessageEvent types.
 * Provides fluent API for constructing complex messages.
 *
 * NOTE: Prefer using MessageEvent types (messageManager.sendEvent()) when possible.
 * Use this only for truly custom messages.
 */

import type { MessageAction, MessageMetadata, MessageTemplate, MessageType } from './message-types';

export class MessageBuilder {
  private message: {
    type: MessageType;
    content: string[];
    metadata: MessageMetadata;
  };

  constructor(nodeId: string) {
    this.message = {
      type: 'info',
      content: [],
      metadata: { nodeId },
    };
  }

  /**
   * Set message type
   */
  setType(type: MessageType): this {
    this.message.type = type;
    return this;
  }

  /**
   * Add a section with title and content
   */
  addSection(title: string, content: string): this {
    this.message.content.push(`**${title}**\n\n${content}`);
    return this;
  }

  /**
   * Add plain text
   */
  addText(text: string): this {
    this.message.content.push(text);
    return this;
  }

  /**
   * Add a horizontal divider
   */
  addDivider(): this {
    this.message.content.push('---');
    return this;
  }

  /**
   * Add a bulleted list
   */
  addList(items: string[], title?: string): this {
    if (title) {
      this.message.content.push(`**${title}**\n`);
    }
    this.message.content.push(items.map((item) => `- ${item}`).join('\n'));
    return this;
  }

  /**
   * Add a numbered list
   */
  addNumberedList(items: string[], title?: string): this {
    if (title) {
      this.message.content.push(`**${title}**\n`);
    }
    this.message.content.push(items.map((item, i) => `${i + 1}. ${item}`).join('\n'));
    return this;
  }

  /**
   * Add a feature list (with checkmarks)
   */
  addFeatureList(features: Array<{ name: string } | string>, title?: string): this {
    if (title) {
      this.message.content.push(`**${title}**\n`);
    }
    this.message.content.push(
      features.map((f) => (typeof f === 'string' ? `✅ ${f}` : `✅ ${f.name}`)).join('\n')
    );
    return this;
  }

  /**
   * Add a code block
   */
  addCode(code: string, language: string = ''): this {
    this.message.content.push(`\`\`\`${language}\n${code}\n\`\`\``);
    return this;
  }

  /**
   * Add inline code
   */
  addInlineCode(code: string): this {
    this.message.content.push(`\`${code}\``);
    return this;
  }

  /**
   * Add a quote/callout
   */
  addQuote(text: string): this {
    this.message.content.push(`> ${text}`);
    return this;
  }

  /**
   * Add a link
   */
  addLink(text: string, url: string): this {
    this.message.content.push(`[${text}](${url})`);
    return this;
  }

  /**
   * Add an emoji prefix to the message
   */
  addEmoji(emoji: string): this {
    if (this.message.content.length === 0) {
      this.message.content.push(emoji);
    } else {
      this.message.content[0] = `${emoji} ${this.message.content[0]}`;
    }
    return this;
  }

  /**
   * Mark message as requiring user response
   */
  requiresResponse(inputType?: MessageMetadata['inputType']): this {
    this.message.metadata.requiresResponse = true;
    if (inputType) {
      this.message.metadata.inputType = inputType;
    }
    return this;
  }

  /**
   * Add action buttons to message
   */
  addAction(action: MessageAction): this {
    if (!this.message.metadata.actions) {
      this.message.metadata.actions = [];
    }
    this.message.metadata.actions.push(action);
    return this;
  }

  /**
   * Set message priority
   */
  setPriority(priority: 'high' | 'normal' | 'low'): this {
    this.message.metadata.priority = priority;
    return this;
  }

  /**
   * Build the final message template
   */
  build(): MessageTemplate {
    return {
      type: this.message.type,
      content: this.message.content.join('\n\n'),
      metadata: this.message.metadata,
    };
  }
}

/**
 * USAGE EXAMPLES
 *
 * Example 1: Simple success message
 * ```typescript
 * const message = new MessageBuilder('custom-node')
 *   .setType('success')
 *   .addEmoji('✅')
 *   .addText('Operation completed successfully!')
 *   .build();
 *
 * await messageManager.sendMessage(projectId, message);
 * ```
 *
 * Example 2: Complex multi-section message
 * ```typescript
 * const message = new MessageBuilder('analysis-node')
 *   .setType('info')
 *   .addSection('Analysis Results', 'I analyzed your request and found the following:')
 *   .addDivider()
 *   .addFeatureList(['Feature 1', 'Feature 2'], 'Features Detected')
 *   .addDivider()
 *   .addSection('Next Steps', 'I will now generate the code.')
 *   .build();
 *
 * await messageManager.sendMessage(projectId, message);
 * ```
 *
 * Example 3: Question with actions
 * ```typescript
 * const message = new MessageBuilder('editor-node')
 *   .setType('question')
 *   .addText('I made some changes. Would you like to keep them?')
 *   .addList(['Updated 3 files', 'Modified 15 lines'], 'Changes')
 *   .requiresResponse()
 *   .addAction({ type: 'confirmation', label: 'Keep Changes', data: { confirm: true } })
 *   .addAction({ type: 'rollback', label: 'Undo', data: { rollback: true } })
 *   .build();
 *
 * await messageManager.sendMessage(projectId, message);
 * ```
 *
 * Example 4: Error with code snippet
 * ```typescript
 * const message = new MessageBuilder('qa-node')
 *   .setType('error')
 *   .addText('TypeScript error found:')
 *   .addCode('const x: number = "string"; // Type mismatch', 'typescript')
 *   .addSection('Suggestion', 'Change the type to `string` or the value to a number.')
 *   .setPriority('high')
 *   .build();
 *
 * await messageManager.sendMessage(projectId, message);
 * ```
 */
