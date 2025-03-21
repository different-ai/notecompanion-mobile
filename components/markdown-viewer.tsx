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

interface MarkdownViewerProps {
  content: string;
  maxHeight?: number;
  showExpandButton?: boolean;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  maxHeight = 200,
  showExpandButton = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const handleContentSizeChange = (width: number, height: number) => {
    setContentHeight(height);
  };

  const shouldShowExpandButton = showExpandButton && contentHeight > maxHeight;

  return (
    <View style={styles.container}>
      <ScrollView
        style={[
          styles.scrollView,
          !isExpanded && { maxHeight },
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleContentSizeChange}
      >
        <Markdown style={markdownStyles}>
          {content}
        </Markdown>
      </ScrollView>
      
      {shouldShowExpandButton && (
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  scrollView: {
    padding: 16,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  expandButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#1a1a1a',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 14,
    color: '#1a1a1a',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#1a1a1a',
  },
  paragraph: {
    marginVertical: 8,
  },
  list: {
    marginVertical: 8,
    paddingLeft: 20,
  },
  listItem: {
    marginVertical: 4,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline' as const,
  },
  code: {
    backgroundColor: '#f8f9fa',
    padding: 4,
    borderRadius: 4,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  codeBlock: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#e1e1e1',
    paddingLeft: 12,
    marginVertical: 8,
    color: '#666',
  },
  image: {
    width: Dimensions.get('window').width - 64,
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
    marginVertical: 8,
  },
}; 