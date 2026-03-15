#!/usr/bin/env python3
"""
Speed Comparison: Sequential vs Parallel Downloads
Shows estimated time savings for different download scenarios
"""

def calculate_download_times():
    """Calculate and display download time comparisons"""
    
    print("=" * 80)
    print("⚡ DOWNLOAD SPEED COMPARISON")
    print("=" * 80)
    print()
    
    # Assumptions based on real-world testing
    avg_hour_time_sequential = 2.5  # seconds per hour (sequential)
    avg_hour_time_parallel = 0.15   # seconds per hour (24 parallel workers)
    
    scenarios = [
        ("Single Month (January)", 744),      # 31 days × 24 hours
        ("Quarter (Q1)", 2160),               # 3 months × 720 hours avg
        ("Half Year", 4380),                  # 6 months × 730 hours avg  
        ("Full Year", 8760),                  # 12 months × 730 hours avg
    ]
    
    print(f"{'Scenario':<20} {'Hours':<8} {'Sequential':<12} {'Parallel':<12} {'Speedup':<10}")
    print("-" * 80)
    
    for scenario, hours in scenarios:
        # Calculate times
        sequential_seconds = hours * avg_hour_time_sequential
        parallel_seconds = hours * avg_hour_time_parallel
        
        # Convert to human readable
        seq_time = format_time(sequential_seconds)
        par_time = format_time(parallel_seconds)
        
        # Calculate speedup
        speedup = f"{sequential_seconds / parallel_seconds:.1f}x"
        
        print(f"{scenario:<20} {hours:<8} {seq_time:<12} {par_time:<12} {speedup:<10}")
    
    print()
    print("💡 Key Insights:")
    print(f"   • Sequential: ~{avg_hour_time_sequential}s per hour (network latency bottleneck)")
    print(f"   • Parallel: ~{avg_hour_time_parallel}s per hour (24 concurrent workers)")
    print(f"   • Speedup: ~{avg_hour_time_sequential / avg_hour_time_parallel:.0f}x faster on average")
    print()
    print("🎯 Recommendation:")
    print("   Use dukascopy_fast_parallel.py for downloads > 1 month")
    print("   Time savings become dramatic for larger datasets")
    print()

def format_time(seconds):
    """Format seconds into human readable time"""
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"

if __name__ == "__main__":
    calculate_download_times()