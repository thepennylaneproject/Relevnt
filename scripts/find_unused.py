
import os
import re

def find_unused_files(src_dir):
    # Set of all TS/TSX files
    all_files = set()
    # Map of filename (without ext) to full path
    file_map = {}
    
    # scan for all files
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx')) and not file.endswith('.d.ts'):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, src_dir)
                all_files.add(rel_path)
                
                # key for matching import
                name_no_ext = os.path.splitext(file)[0]
                file_map[rel_path] = name_no_ext

    # Set of referenced files
    referenced_files = set()
    
    # Hardcoded entry points
    entry_types = ['main.tsx', 'vite-env.d.ts', 'App.tsx']
    for f in all_files:
        if os.path.basename(f) in entry_types:
            referenced_files.add(f)

    # Scan content for imports
    for f in all_files:
        with open(os.path.join(src_dir, f), 'r', encoding='utf-8') as content_file:
            content = content_file.read()
            
            # Simple regex to find imports
            # This handles:
            # import ... from './foo'
            # import ... from '../components/Bar'
            # require('./foo')
            # import('./foo')
            
            imports = re.findall(r"['\"](\..*?)['\"]", content)
            
            for imp in imports:
                # Resolve import to potential file paths
                current_dir = os.path.dirname(os.path.join(src_dir, f))
                resolved_path = os.path.normpath(os.path.join(current_dir, imp))
                
                # Check extensions
                candidates = [
                    resolved_path + '.ts',
                    resolved_path + '.tsx',
                    os.path.join(resolved_path, 'index.ts'),
                    os.path.join(resolved_path, 'index.tsx')
                ]
                
                for cand in candidates:
                    rel_cand = os.path.relpath(cand, src_dir)
                    if rel_cand in all_files:
                        referenced_files.add(rel_cand)

    unused = all_files - referenced_files
    return sorted(list(unused))

if __name__ == "__main__":
    src_dir = '/Users/sarahsahl/Desktop/relevnt-fresh/src'
    unused = find_unused_files(src_dir)
    print("Potential unused files:")
    for u in unused:
        print(u)
