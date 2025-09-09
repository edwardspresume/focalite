<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';

  let timeRemaining = $state(0);
  let now = $state(Date.now());

  // Get break end time from URL params or localStorage
  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const endTime = params.get('endTime') || localStorage.getItem('breakEndTime');
    
    if (endTime) {
      const endTimeMs = parseInt(endTime);
      
      // Update remaining time
      const updateTime = () => {
        now = Date.now();
        timeRemaining = Math.max(0, Math.ceil((endTimeMs - now) / 1000));
        
        if (timeRemaining <= 0) {
          endBreak();
        }
      };
      
      updateTime();
      const interval = setInterval(updateTime, 1000);
      
      return () => clearInterval(interval);
    } else {
      // Fallback: set a default break time if no end time is found
      timeRemaining = 300; // 5 minutes default
      const interval = setInterval(() => {
        timeRemaining = Math.max(0, timeRemaining - 1);
        if (timeRemaining <= 0) {
          endBreak();
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  });

  const formatTime = $derived.by(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  });

  async function endBreak() {
    try {
      await invoke('end_break_from_overlay');
    } catch (error) {
      console.error('Failed to end break:', error);
    }
  }

  // Prevent context menu and common shortcuts
  function handleKeyDown(event: KeyboardEvent) {
    // Block common shortcuts that might help escape the overlay
    if (event.altKey || event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }
    
    // Block F11, Alt+Tab, Alt+F4, etc.
    if (event.key === 'F11' || 
        (event.altKey && (event.key === 'Tab' || event.key === 'F4')) ||
        (event.ctrlKey && (event.key === 'w' || event.key === 'q'))) {
      event.preventDefault();
    }
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<!-- Break Overlay Screen -->
<main 
  class="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex flex-col items-center justify-center text-white cursor-default select-none"
  oncontextmenu={handleContextMenu}
>
  <!-- Break Message -->
  <div class="text-center mb-12">
    <div class="mb-6">
      <div class="text-8xl mb-4">🛌</div>
      <h1 class="text-6xl font-bold mb-4">Break Time!</h1>
      <p class="text-2xl opacity-90">Time to rest your eyes and mind</p>
    </div>
    
    <!-- Countdown Timer -->
    <div class="text-7xl font-mono font-bold mb-8 bg-black/20 rounded-2xl px-8 py-4">
      {formatTime}
    </div>
  </div>

  <!-- End Break Button -->
  <button
    onclick={endBreak}
    class="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-200 border-2 border-white/30 hover:border-white/50"
  >
    End Break Early
  </button>

  <!-- Instructions -->
  <div class="absolute bottom-8 text-center text-lg opacity-75">
    <p>This overlay will automatically close when your break is over.</p>
    <p class="text-sm mt-2">Working apps are blocked until break completes.</p>
  </div>
</main>

<style>
  main {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    overflow: hidden;
  }
  
  :global(body) {
    overflow: hidden;
  }
</style>