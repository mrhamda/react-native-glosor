import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const { width, height } = Dimensions.get("window");

// Helper to shuffle arrays
const shuffleArray = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function BirdGame() {
  const { wordPairs, language } = useLocalSearchParams();

  const cleanPairs = wordPairs
    ? JSON.parse(wordPairs)
        .filter((item) => item.selected)
        .map((item) => ({
          first: item.first.trim(),
          second: item.second.trim(),
        }))
    : [];

  const [index, setIndex] = useState(0);
  const [birdX, setBirdX] = useState(width / 2 - 25);
  const [birdY, setBirdY] = useState(height - 100);
  const [gameOver, setGameOver] = useState(false);
  const [options, setOptions] = useState([]);
  const [direction, setDirection] = useState("first");

  const optionRefs = useRef([]);
  const [optionLayouts, setOptionLayouts] = useState([]);

  const currentCard = cleanPairs[index];

  // Setup current card options
  useEffect(() => {
    if (!currentCard) return;

    const dir =
      language === "both"
        ? Math.random() < 0.5
          ? "first"
          : "second"
        : language;
    setDirection(dir);

    const correctAnswer = (
      dir === "first" ? currentCard.first : currentCard.second
    )
      .trim()
      .toLowerCase();

    const wrongs = shuffleArray(cleanPairs)
      .filter(
        (p) => p.first !== currentCard.first && p.second !== currentCard.second
      )
      .slice(0, 2)
      .map((p) => (dir === "first" ? p.first : p.second).trim().toLowerCase());

    const opts = shuffleArray([correctAnswer, ...wrongs]);
    setOptions(opts);
  }, [index]);

  // Measure options after render
  useEffect(() => {
    if (!options.length) return;

    const layouts = [];
    optionRefs.current.forEach((ref, i) => {
      if (ref) {
        ref.measure((fx, fy, w, h, px, py) => {
          layouts[i] = { left: px, right: px + w };
          if (layouts.length === options.length) {
            setOptionLayouts(layouts);
          }
        });
      }
    });
  }, [options]);

  // Bird auto moves up
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBirdY((y) => {
        if (y <= 100) {
          checkCollision();
          return height - 100; // reset down
        }
        return y - 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameOver, index, options, optionLayouts]);

  // Drag handling
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      setBirdX((prevX) => {
        let newX = prevX + gesture.dx;
        if (newX < 0) newX = 0;
        if (newX > width - 50) newX = width - 50;
        return newX;
      });
    },
  });

  // Collision detection
  const checkCollision = () => {
    if (!options.length || !optionLayouts.length) return;

    const birdCenterX = birdX + 25;

    let chosenIndex = optionLayouts.findIndex(
      (layout) => birdCenterX >= layout.left && birdCenterX <= layout.right
    );

    if (chosenIndex === -1) {
      // fallback: closest option
      chosenIndex = optionLayouts.reduce((closest, layout, i) => {
        const center = (layout.left + layout.right) / 2;
        const dist = Math.abs(birdCenterX - center);
        const prevCenter =
          (optionLayouts[closest].left + optionLayouts[closest].right) / 2;
        return dist < Math.abs(birdCenterX - prevCenter) ? i : closest;
      }, 0);
    }

    const chosen = options[chosenIndex];
    const correctAnswer = (
      direction === "first" ? currentCard.first : currentCard.second
    )
      .trim()
      .toLowerCase();

    if (chosen === correctAnswer) {
      if (index < cleanPairs.length - 1) setIndex((i) => i + 1);
      else setGameOver("finished");
    } else {
      alert(
        "CORRECT ANSWER: " +
          correctAnswer +
          " | CHOSEN: " +
          chosen +
          " | CURRENT CARD: " +
          JSON.stringify(currentCard)
      );
      setGameOver("failed");
    }
  };

  const handleRestart = () => {
    setIndex(0);
    setBirdX(width / 2 - 25);
    setBirdY(height - 100);
    setGameOver(false);
  };

  if (!cleanPairs.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No word pairs selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {gameOver === "failed" ? (
        <View style={styles.center}>
          <Text style={styles.question}>Game Over!</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRestart}>
            <Text style={styles.retryText}>Restart</Text>
          </TouchableOpacity>
        </View>
      ) : gameOver === "finished" ? (
        <View style={styles.center}>
          <Text style={styles.question}>Well done! 🎉</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRestart}>
            <Text style={styles.retryText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.question}>
            {direction === "first" ? currentCard.second : currentCard.first}
          </Text>

          <View style={styles.optionsRow}>
            {options.map((opt, i) => (
              <View
                key={i}
                ref={(el) => (optionRefs.current[i] = el)}
                style={[styles.optionBox, { width: width / options.length }]}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.bird, { left: birdX, top: birdY }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#87CEEB" },
  question: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    color: "#fff",
  },
  optionsRow: {
    flexDirection: "row",
    position: "absolute",
    top: 80,
    width: "100%",
  },
  optionBox: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  optionText: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  bird: {
    width: 50,
    height: 50,
    backgroundColor: "yellow",
    borderRadius: 25,
    position: "absolute",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    fontSize: 20,
    color: "gray",
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  retryText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
