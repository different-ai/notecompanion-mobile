import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

interface TextDocumentViewerProps {
  content: string;
  title?: string;
  metadata?: {
    date?: string;
    page?: string;
    source?: string;
  };
}

export const TextDocumentViewer: React.FC<TextDocumentViewerProps> = ({
  content,
  title,
  metadata,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container}>
      {/* Document Header */}
      {(title || metadata) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {metadata?.date && (
            <Text style={styles.metadata}>Date: {metadata.date}</Text>
          )}
          {metadata?.page && (
            <Text style={styles.metadata}>Page: {metadata.page}</Text>
          )}
          {metadata?.source && (
            <Text style={styles.metadata}>Source: {metadata.source}</Text>
          )}
        </View>
      )}

      {/* Document Content */}
      <ScrollView
        style={[
          styles.contentContainer,
          !isExpanded && { maxHeight: 400 },
        ]}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.contentWrapper}>
          <Markdown
            style={markdownStyles}
            mergeStyle={true}
          >
            {content}
          </Markdown>
        </View>
      </ScrollView>

      {/* Expand/Collapse Button */}
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <MaterialIcons
          name={isExpanded ? 'expand-less' : 'expand-more'}
          size={24}
          color="#007AFF"
        />
        <Text style={styles.expandButtonText}>
          {isExpanded ? 'Show less' : 'Show more'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  metadata: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contentContainer: {
    backgroundColor: '#fff',
  },
  contentWrapper: {
    padding: 16,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    backgroundColor: '#f8f9fa',
  },
  expandButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2c3e50',
  },
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    paddingBottom: 8,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginVertical: 14,
  },
  heading3: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginVertical: 12,
  },
  paragraph: {
    marginVertical: 12,
  },
  list: {
    marginVertical: 8,
  },
  listItem: {
    marginVertical: 4,
  },
  listUnorderedItemIcon: {
    fontSize: 16,
    lineHeight: 24,
    color: '#007AFF',
    marginRight: 8,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline' as const,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingLeft: 16,
    marginVertical: 12,
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
  },
  code_inline: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
  },
  code_block: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontSize: 14,
  },
  fence: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontSize: 14,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    marginVertical: 12,
  },
  thead: {
    backgroundColor: '#f8f9fa',
  },
  th: {
    padding: 12,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e1e1e1',
  },
  td: {
    padding: 12,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e1e1e1',
  },
}; 