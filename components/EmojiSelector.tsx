// @ts-nocheck
/**
 * This is manually copied code from https://github.com/arronhunt/react-native-emoji-selector/blob/master/index.js
 * 
 * It's a modified version of the original code that allows for end-to-end testing
 * 
 * In the future, we should consider forking or opening a PR to the original repo
 * to add this functionality.
 * 
 * Ignore the type errors, they're just because the original code is not typed. Minimal typing is added.
 */
import React, { Component } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  FlatList
} from "react-native";
import emoji from "emoji-datasource";

interface Category {
  symbol: string | null;
  name: string;
}

interface Categories {
  [key: string]: Category;
}

export const Categories: Categories = {
  all: {
    symbol: null,
    name: "All"
  },
  history: {
    symbol: "🕘",
    name: "Recently used"
  },
  emotion: {
    symbol: "😀",
    name: "Smileys & Emotion"
  },
  people: {
    symbol: "🧑",
    name: "People & Body"
  },
  nature: {
    symbol: "🦄",
    name: "Animals & Nature"
  },
  food: {
    symbol: "🍔",
    name: "Food & Drink"
  },
  activities: {
    symbol: "⚾️",
    name: "Activities"
  },
  places: {
    symbol: "✈️",
    name: "Travel & Places"
  },
  objects: {
    symbol: "💡",
    name: "Objects"
  },
  symbols: {
    symbol: "🔣",
    name: "Symbols"
  },
  flags: {
    symbol: "🏳️‍🌈",
    name: "Flags"
  }
};

const charFromUtf16 = (utf16: string): string =>
  String.fromCodePoint(...utf16.split("-").map(u => parseInt("0x" + u)));
export const charFromEmojiObject = obj => charFromUtf16(obj.unified);
const filteredEmojis = emoji.filter(e => !e["obsoleted_by"]);
const emojiByCategory = category =>
  filteredEmojis.filter(e => e.category === category);
const sortEmoji = list => list.sort((a, b) => a.sort_order - b.sort_order);
const categoryKeys = Object.keys(Categories);

interface TabBarProps {
  theme: string;
  activeCategory: Category;
  onPress: (category: Category) => void;
  width: number;
}

const TabBar: React.FC<TabBarProps> = ({ theme, activeCategory, onPress, width }) => {
  const tabSize = width / categoryKeys.length;

  return categoryKeys.map(c => {
    const category = Categories[c];
    if (c !== "all")
      return (
        <TouchableOpacity
          key={category.name}
          onPress={() => onPress(category)}
          style={{
            flex: 1,
            height: tabSize,
            borderColor: category === activeCategory ? theme : "#EEEEEE",
            borderBottomWidth: 2,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Text
            style={{
              textAlign: "center",
              paddingBottom: 8,
              fontSize: tabSize - 24
            }}
          >
            {category.symbol}
          </Text>
        </TouchableOpacity>
      );
  });
};

interface EmojiCellProps {
  emoji: EmojiObject;
  colSize: number;
  onPress: () => void;
}

const EmojiCell: React.FC<EmojiCellProps> = ({ emoji, colSize, ...other }) => (
  <TouchableOpacity
    activeOpacity={0.5}
    style={{
      width: colSize,
      height: colSize,
      alignItems: "center",
      justifyContent: "center"
    }}
    testID={`emoji-${emoji.unified}`}
    accessible={false}
    {...other}
  >
    <Text
      style={{ color: "#FFFFFF", fontSize: colSize - 12 }}
      accessible={true}
      accessibilityLabel={`emoji-${emoji.unified}`}
      accessibilityRole="button"
    >
      {charFromEmojiObject(emoji)}
    </Text>
  </TouchableOpacity>
);

interface EmojiObject {
  unified: string;
  obsoleted_by?: string;
  category: string;
  sort_order: number;
  short_names: string[];
}

interface EmojiSelectorProps {
  theme?: string;
  category?: Category;
  onEmojiSelected: (emoji: string) => void;
  showTabs?: boolean;
  showSearchBar?: boolean;
  showHistory?: boolean;
  showSectionTitles?: boolean;
  columns?: number;
  placeholder?: string;
  shouldInclude?: (emoji: EmojiObject) => boolean;
}

interface EmojiSelectorState {
  searchQuery: string;
  category: Category;
  isReady: boolean;
  history: EmojiObject[];
  emojiList: { [key: string]: EmojiObject[] } | null;
  colSize: number;
  width: number;
}

export default class EmojiSelector extends Component<EmojiSelectorProps, EmojiSelectorState> {
  private scrollview: FlatList | null = null;

  state: EmojiSelectorState = {
    searchQuery: "",
    category: Categories.people,
    isReady: false,
    history: [],
    emojiList: null,
    colSize: 0,
    width: 0
  };

  //
  //  HANDLER METHODS
  //
  handleTabSelect = (category: Category) => {
    if (this.state.isReady) {
      if (this.scrollview)
        this.scrollview.scrollToOffset({ x: 0, y: 0, animated: false });
      this.setState({
        searchQuery: "",
        category
      });
    }
  };

  handleEmojiSelect = (emoji: EmojiObject) => {
    if (this.props.showHistory) {
      this.addToHistoryAsync(emoji);
    }
    this.props.onEmojiSelected(charFromEmojiObject(emoji));
  };

  handleSearch = (searchQuery: string) => {
    this.setState({ searchQuery });
  };

  addToHistoryAsync = async (emoji: EmojiObject) => {
    // no-op
  };

  loadHistoryAsync = async () => {
    // no-op
  };

  //
  //  RENDER METHODS
  //
  renderEmojiCell = ({ item }: { item: { key: string; emoji: EmojiObject } }) => (
    <EmojiCell
      key={item.key}
      emoji={item.emoji}
      onPress={() => this.handleEmojiSelect(item.emoji)}
      colSize={this.state.colSize}
    />
  );

  returnSectionData() {
    const { history, emojiList, searchQuery, category } = this.state;
    let emojiData = (function() {
      if (category === Categories.all && searchQuery === "") {
        let largeList: EmojiObject[] = [];
        categoryKeys.forEach(c => {
          const name = Categories[c].name;
          const list: EmojiObject[] =
            name === Categories.history.name ? history : emojiList?.[name] || [];
          if (c !== "all" && c !== "history") largeList = largeList.concat(list);
        });

        return largeList.map(emoji => ({ key: emoji.unified, emoji }));
      } else {
        let list: EmojiObject[];
        const hasSearchQuery = searchQuery !== "";
        const name = category.name;
        if (hasSearchQuery) {
          const filtered = emoji.filter(e => {
            let display = false;
            e.short_names.forEach(name => {
              if (name.includes(searchQuery.toLowerCase())) display = true;
            });
            return display;
          });
          list = sortEmoji(filtered);
        } else if (name === Categories.history.name) {
          list = history;
        } else {
          list = emojiList?.[name] || [];
        }
        return list.map(emoji => ({ key: emoji.unified, emoji }));
      }
    })();
    return this.props.shouldInclude ? emojiData.filter(e => this.props.shouldInclude!(e.emoji)) : emojiData;
  }

  prerenderEmojis(callback: () => void) {
    let emojiList: { [key: string]: EmojiObject[] } = {};
    categoryKeys.forEach(c => {
      let name = Categories[c].name;
      emojiList[name] = sortEmoji(emojiByCategory(name));
    });

    this.setState(
      {
        emojiList,
        colSize: Math.floor(this.state.width / (this.props.columns || 6))
      },
      callback
    );
  }

  handleLayout = ({ nativeEvent: { layout } }: { nativeEvent: { layout: { width: number } } }) => {
    this.setState({ width: layout.width }, () => {
      this.prerenderEmojis(() => {
        this.setState({ isReady: true });
      });
    });
  };

  //
  //  LIFECYCLE METHODS
  //
  componentDidMount() {
    const { category, showHistory } = this.props;
    this.setState({ category });

    if (showHistory) {
      this.loadHistoryAsync();
    }
  }

  render() {
    const {
      theme,
      columns,
      placeholder,
      showHistory,
      showSearchBar,
      showSectionTitles,
      showTabs,
      ...other
    } = this.props;

    const { category, colSize, isReady, searchQuery } = this.state;

    const Searchbar = (
      <View style={styles.searchbar_container}>
        <TextInput
          style={styles.search}
          placeholder={placeholder}
          clearButtonMode="always"
          returnKeyType="done"
          autoCorrect={false}
          underlineColorAndroid={theme}
          value={searchQuery}
          onChangeText={this.handleSearch}
        />
      </View>
    );

    const title = searchQuery !== "" ? "Search Results" : category.name;

    return (
      <View style={styles.frame} {...other} onLayout={this.handleLayout}>
        <View style={styles.tabBar}>
          {showTabs && (
            <TabBar
              activeCategory={category}
              onPress={this.handleTabSelect}
              theme={theme}
              width={this.state.width}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          {showSearchBar && Searchbar}
          {isReady ? (
            <View style={{ flex: 1 }}>
              <View style={styles.container}>
                {showSectionTitles && (
                  <Text style={styles.sectionHeader}>{title}</Text>
                )}
                <FlatList
                  style={styles.scrollview}
                  contentContainerStyle={{ paddingBottom: colSize }}
                  data={this.returnSectionData()}
                  renderItem={this.renderEmojiCell}
                  testID={"emoji-list"}
                  accessible={false}
                  horizontal={false}
                  numColumns={columns}
                  keyboardShouldPersistTaps={"always"}
                  ref={scrollview => (this.scrollview = scrollview)}
                  initialNumToRender={20}
                  maxToRenderPerBatch={20}
                  windowSize={5}
                  viewabilityConfig={{
                    waitForInteraction: true,
                    viewAreaCoveragePercentThreshold: 0
                  }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.loader} {...other}>
              <ActivityIndicator
                size={"large"}
                color={Platform.OS === "android" ? theme : "#000000"}
              />
            </View>
          )}
        </View>
      </View>
    );
  }
}

EmojiSelector.defaultProps = {
  theme: "#007AFF",
  category: Categories.all,
  showTabs: true,
  showSearchBar: true,
  showHistory: false,
  showSectionTitles: true,
  columns: 6,
  placeholder: "Search..."
};

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    width: "100%"
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  tabBar: {
    flexDirection: "row"
  },
  scrollview: {
    flex: 1
  },
  searchbar_container: {
    width: "100%",
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.75)"
  },
  search: {
    ...Platform.select({
      ios: {
        height: 36,
        paddingLeft: 8,
        borderRadius: 10,
        backgroundColor: "#E5E8E9"
      }
    }),
    margin: 8
  },
  container: {
    flex: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "flex-start"
  },
  sectionHeader: {
    margin: 8,
    fontSize: 17,
    width: "100%",
    color: "#8F8F8F"
  }
});
