// life_agent_vpn.dart — Project LIFE Agent
// Mobile Legibility Engine via On-Device VPN
// All analysis performed locally. Nothing leaves the device.

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AnalyzedPacket {
  final String sourceApp;
  final String destinationDomain;
  final String destinationIP;
  final int port;
  final String protocol;
  final int size;
  final DateTime timestamp;
  final bool isEncrypted;
  final String? companyOwner;
  final String riskLevel;
  final String dataCategory;
  final Map<String, dynamic> metadata;

  AnalyzedPacket({
    required this.sourceApp,
    required this.destinationDomain,
    required this.destinationIP,
    required this.port,
    required this.protocol,
    required this.size,
    required this.timestamp,
    required this.isEncrypted,
    this.companyOwner,
    this.riskLevel = 'unknown',
    this.dataCategory = 'unknown',
    this.metadata = const {},
  });

  Map<String, dynamic> toJson() => {
    'sourceApp': sourceApp,
    'destinationDomain': destinationDomain,
    'destinationIP': destinationIP,
    'port': port,
    'protocol': protocol,
    'size': size,
    'timestamp': timestamp.toIso8601String(),
    'isEncrypted': isEncrypted,
    'companyOwner': companyOwner,
    'riskLevel': riskLevel,
    'dataCategory': dataCategory,
  };
}

class TrackerDatabase {
  static final Map<String, Map<String, dynamic>> trackers = {
    'doubleclick.net': {'owner': 'Google', 'category': 'advertising', 'risk': 'high'},
    'google-analytics.com': {'owner': 'Google', 'category': 'analytics', 'risk': 'high'},
    'googlesyndication.com': {'owner': 'Google', 'category': 'advertising', 'risk': 'high'},
    'facebook.com': {'owner': 'Meta', 'category': 'social_graph', 'risk': 'critical', 'note': 'Builds shadow profiles of non-users'},
    'fbcdn.net': {'owner': 'Meta', 'category': 'content_delivery', 'risk': 'high'},
    'facebook.net': {'owner': 'Meta', 'category': 'social_graph', 'risk': 'critical'},
    'hotjar.com': {'owner': 'Hotjar', 'category': 'session_recording', 'risk': 'critical'},
    'fullstory.com': {'owner': 'FullStory', 'category': 'session_recording', 'risk': 'critical', 'note': 'Complete session replay'},
    'mixpanel.com': {'owner': 'Mixpanel', 'category': 'product_analytics', 'risk': 'high'},
    'amplitude.com': {'owner': 'Amplitude', 'category': 'behavioral_analytics', 'risk': 'high'},
    'segment.io': {'owner': 'Twilio', 'category': 'data_pipeline', 'risk': 'critical', 'note': 'Routes data to hundreds of services'},
    'branch.io': {'owner': 'Branch', 'category': 'deep_linking', 'risk': 'high'},
    'appsflyer.com': {'owner': 'AppsFlyer', 'category': 'mobile_analytics', 'risk': 'high'},
    'adjust.com': {'owner': 'Adjust', 'category': 'mobile_analytics', 'risk': 'high'},
    'onesignal.com': {'owner': 'OneSignal', 'category': 'push_notifications', 'risk': 'high'},
    'criteo.com': {'owner': 'Criteo', 'category': 'retargeting', 'risk': 'high'},
    'foursquare.com': {'owner': 'Foursquare', 'category': 'location', 'risk': 'critical', 'note': 'Tracks physical location even when app is closed'},
    'addthis.com': {'owner': 'Oracle', 'category': 'social_tracking', 'risk': 'critical'},
    'bluekai.com': {'owner': 'Oracle', 'category': 'data_marketplace', 'risk': 'critical'},
    'tapad.com': {'owner': 'Tapad', 'category': 'cross_device', 'risk': 'critical', 'note': 'Cross-device tracking links all your devices'},
  };

  static Map<String, dynamic>? lookup(String domain) {
    if (trackers.containsKey(domain)) return trackers[domain];
    for (var trackerDomain in trackers.keys) {
      if (domain.endsWith('.$trackerDomain') || domain == trackerDomain) {
        return trackers[trackerDomain];
      }
    }
    return null;
  }
}

class TrafficAnalyzer {
  final StreamController<AnalyzedPacket> _packetController = StreamController<AnalyzedPacket>.broadcast();
  Stream<AnalyzedPacket> get packetStream => _packetController.stream;
  
  final List<AnalyzedPacket> _packetHistory = [];
  final Map<String, int> _trackerCounts = {};
  final Map<String, int> _appDataUsage = {};
  final Map<String, List<AnalyzedPacket>> _packetsByApp = {};
  DateTime sessionStart = DateTime.now();
  
  AnalyzedPacket analyzePacket({
    required String sourceApp,
    required String destinationDomain,
    required String destinationIP,
    required int port,
    required String protocol,
    required int size,
  }) {
    final trackerInfo = TrackerDatabase.lookup(destinationDomain);
    
    final packet = AnalyzedPacket(
      sourceApp: sourceApp,
      destinationDomain: destinationDomain,
      destinationIP: destinationIP,
      port: port,
      protocol: protocol,
      size: size,
      timestamp: DateTime.now(),
      isEncrypted: port == 443 || port == 8443,
      companyOwner: trackerInfo?['owner'],
      riskLevel: trackerInfo?['risk'] ?? _assessRisk(destinationDomain, port),
      dataCategory: trackerInfo?['category'] ?? _categorizeTraffic(destinationDomain, port),
      metadata: trackerInfo ?? {},
    );
    
    _packetHistory.add(packet);
    _trackerCounts[destinationDomain] = (_trackerCounts[destinationDomain] ?? 0) + 1;
    _appDataUsage[sourceApp] = (_appDataUsage[sourceApp] ?? 0) + size;
    _packetsByApp.putIfAbsent(sourceApp, () => []);
    _packetsByApp[sourceApp]!.add(packet);
    _packetController.add(packet);
    
    return packet;
  }
  
  String _assessRisk(String domain, int port) {
    if (port == 8080 || port == 8443 || port > 10000) return 'medium';
    final riskyTLDs = ['.ru', '.cn', '.kp', '.ir'];
    for (var tld in riskyTLDs) {
      if (domain.endsWith(tld)) return 'high';
    }
    if (RegExp(r'[a-z0-9]{20,}\.').hasMatch(domain)) return 'medium';
    return 'low';
  }
  
  String _categorizeTraffic(String domain, int port) {
    if (domain.contains('analytics') || domain.contains('metric') || domain.contains('track') || domain.contains('stats') || domain.contains('pixel') || domain.contains('beacon')) return 'analytics';
    if (domain.contains('ad') || domain.contains('doubleclick') || domain.contains('ads') || domain.contains('advert') || domain.contains('criteo') || domain.contains('taboola') || domain.contains('outbrain')) return 'advertising';
    if (domain.contains('cdn') || domain.contains('static') || domain.contains('assets') || domain.contains('img') || domain.contains('image')) return 'content_delivery';
    if (port == 443 || port == 80) return 'web_traffic';
    if (port == 5228 || port == 5229 || port == 5230) return 'push_notification';
    return 'unknown';
  }
  
  Map<String, dynamic> generateReport() {
    final uniqueTrackers = _trackerCounts.keys.where((domain) => TrackerDatabase.lookup(domain) != null).toList();
    final criticalTrackers = uniqueTrackers.where((domain) => TrackerDatabase.lookup(domain)?['risk'] == 'critical').toList();
    final totalDataUsed = _appDataUsage.values.fold(0, (a, b) => a + b);
    final trackingDataUsed = _packetHistory.where((p) => p.riskLevel == 'high' || p.riskLevel == 'critical').fold<int>(0, (sum, p) => sum + p.size);
    
    final appsByTracking = Map<String, int>.fromIterable(_packetsByApp.keys)
      ..updateAll((app, _) => _packetsByApp[app]!.where((p) => p.riskLevel == 'high' || p.riskLevel == 'critical').length);
    final sortedApps = appsByTracking.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    
    int surveillanceScore = 0;
    surveillanceScore += criticalTrackers.length * 15;
    surveillanceScore += (uniqueTrackers.length - criticalTrackers.length) * 5;
    surveillanceScore += ((trackingDataUsed / totalDataUsed) * 20).round();
    surveillanceScore = surveillanceScore.clamp(0, 100);
    
    return {
      'session_duration_seconds': DateTime.now().difference(sessionStart).inSeconds,
      'total_packets_analyzed': _packetHistory.length,
      'unique_domains_contacted': _trackerCounts.length,
      'unique_trackers_detected': uniqueTrackers.length,
      'critical_trackers': criticalTrackers.length,
      'total_data_used_mb': (totalDataUsed / (1024 * 1024)).toStringAsFixed(2),
      'tracking_data_mb': (trackingDataUsed / (1024 * 1024)).toStringAsFixed(2),
      'tracking_percentage': totalDataUsed > 0 ? ((trackingDataUsed / totalDataUsed) * 100).toStringAsFixed(1) : '0',
      'surveillance_score': surveillanceScore,
      'top_tracked_apps': sortedApps.take(5).map((e) => {
        'app': e.key, 'tracking_requests': e.value,
        'data_sent_mb': (_appDataUsage[e.key] ?? 0 / (1024 * 1024)).toStringAsFixed(2),
      }).toList(),
      'critical_tracker_list': criticalTrackers.map((d) => {
        'domain': d, 'owner': TrackerDatabase.lookup(d)?['owner'] ?? 'Unknown',
        'requests': _trackerCounts[d] ?? 0,
        'note': TrackerDatabase.lookup(d)?['note'] ?? 'Tracks your behavior',
      }).toList(),
      'harm_assessment': _generateHarmAssessment(uniqueTrackers.length, criticalTrackers.length, surveillanceScore),
      'recommendations': _generateRecommendations(criticalTrackers, sortedApps),
    };
  }
  
  String _generateHarmAssessment(int totalTrackers, int criticalTrackers, int score) {
    if (score >= 80) return 'CRITICAL: Your device is under heavy surveillance. $criticalTrackers critical trackers detected.';
    if (score >= 50) return 'HIGH: Significant tracking detected. $totalTrackers trackers monitoring your activity.';
    if (score >= 25) return 'MODERATE: Standard surveillance infrastructure detected.';
    return 'LOW: Fewer trackers than average detected.';
  }
  
  List<String> _generateRecommendations(List<String> criticalTrackers, List<MapEntry<String, int>> topApps) {
    final recommendations = <String>[];
    if (criticalTrackers.isNotEmpty) recommendations.add('Consider replacing apps with privacy-respecting alternatives.');
    if (topApps.isNotEmpty && topApps.first.value > 50) recommendations.add('${topApps.first.key} is making excessive tracking requests.');
    recommendations.add('Use the LIFE Agent Inversion Protocol to file DSARs.');
    recommendations.add('Enable DNS-level blocking of known tracker domains.');
    return recommendations;
  }
  
  void dispose() => _packetController.close();
}

class LifeAgentVPNService {
  bool _isRunning = false;
  final TrafficAnalyzer analyzer = TrafficAnalyzer();
  
  Future<bool> start() async {
    if (_isRunning) return true;
    print('[LIFE VPN] Starting local traffic analysis...');
    print('[LIFE VPN] NO data leaves your device');
    _isRunning = true;
    return true;
  }
  
  Future<void> stop() async {
    if (!_isRunning) return;
    print('[LIFE VPN] Stopping traffic analysis...');
    _isRunning = false;
    final report = analyzer.generateReport();
    print('[LIFE VPN] Final Report generated');
  }
  
  bool get isRunning => _isRunning;
  
  Map<String, dynamic> getStats() {
    final report = analyzer.generateReport();
    return {
      'running': _isRunning,
      'trackers_detected': report['unique_trackers_detected'],
      'critical_trackers': report['critical_trackers'],
      'surveillance_score': report['surveillance_score'],
      'tracking_percentage': report['tracking_percentage'],
    };
  }
  
  void dispose() => analyzer.dispose();
}
