import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface MarkdownPreviewProps {
  content: string;
  maxCollapsedHeight?: number;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  maxCollapsedHeight = 200,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!content) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="notes" size={48} color="#8E8E93" />
        <Text style={styles.emptyText}>No text content available</Text>
      </View>
    );
  }

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const markdownStyles = {
    body: {
      color: '#333',
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: '#111',
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: '#222',
    },
    heading3: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: '#333',
    },
    link: {
      color: '#007AFF',
      textDecorationLine: 'underline',
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: '#ddd',
      paddingLeft: 16,
      marginLeft: 0,
      fontStyle: 'italic',
      color: '#555',
    },
    code_block: {
      backgroundColor: '#f5f5f5',
      padding: 12,
      borderRadius: 4,
      fontFamily: 'Courier',
      fontSize: 14,
    },
    code_inline: {
      backgroundColor: '#f5f5f5',
      fontFamily: 'Courier',
      fontSize: 14,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    list_item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialIcons name="description" size={24} color="#007AFF" />
        <Text style={styles.headerText}>Extracted Text</Text>
      </View>
      
      <View style={[
        styles.contentContainer,
        expanded ? styles.expandedContent : styles.collapsedContent,
      ]}>
        <ScrollView
          style={expanded ? { maxHeight: 600 } : { maxHeight: maxCollapsedHeight }}
          showsVerticalScrollIndicator={true}
        >
          <Markdown style={markdownStyles}>
            {content}
          </Markdown>
        </ScrollView>
      </View>
      
      <TouchableOpacity
        style={styles.expandButton}
        onPress={toggleExpand}
      >
        <Text style={styles.expandButtonText}>
          {expanded ? 'Show Less' : 'Show More'}
        </Text>
        <MaterialIcons
          name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color="#007AFF"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    overflow: 'hidden',
    marginVertical: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#f8f9fa',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1a1a1a',
  },
  contentContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  collapsedContent: {
    maxHeight: 240, // This includes padding
  },
  expandedContent: {
    maxHeight: 640, // This includes padding
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
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
