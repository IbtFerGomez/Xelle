import matplotlib.pyplot as plt
import matplotlib.patches as patches

def create_palette_visual(palettes, title_text):
    # Setup figure
    num_palettes = len(palettes)
    fig, ax = plt.subplots(figsize=(10, num_palettes * 2.5))
    
    # Remove axes
    ax.set_xlim(0, 10)
    ax.set_ylim(0, num_palettes)
    ax.axis('off')
    
    # Draw palettes
    for i, (name, colors) in enumerate(palettes.items()):
        y_pos = num_palettes - 1 - i
        
        # Draw Palette Title
        ax.text(0, y_pos + 0.6, name, fontsize=12, fontweight='bold', color='#333333')
        
        num_colors = len(colors)
        width = 10 / num_colors
        
        for j, (col_name, hex_code) in enumerate(colors):
            x_pos = j * width
            
            # Draw Rectangle
            rect = patches.Rectangle((x_pos, y_pos), width - 0.2, 0.5, linewidth=1, edgecolor='none', facecolor=hex_code)
            ax.add_patch(rect)
            
            # Text Labels
            ax.text(x_pos + (width/2) - 0.1, y_pos - 0.2, hex_code, fontsize=10, ha='center', fontfamily='monospace', fontweight='bold')
            ax.text(x_pos + (width/2) - 0.1, y_pos - 0.4, col_name, fontsize=9, ha='center', color='#666666')

    plt.tight_layout()
    plt.savefig('paletas_de_colores.png', dpi=300, bbox_inches='tight')
    plt.show()

# Data for Palettes
palettes_data = {
    "1. Corporativa (Seriedad y Confianza)": [
        ("Principal", "#2FA583"), ("Navy", "#1E3A5F"), ("Sky", "#64C4ED"), ("Surface", "#F4F8F6")
    ],
    "2. Vibrante (Alto Contraste)": [
        ("Principal", "#2FA583"), ("Coral", "#FF6B6B"), ("Lime", "#A3E635"), ("Charcoal", "#264653")
    ],
    "3. Naturaleza (Armonía)": [
        ("Principal", "#2FA583"), ("Tint", "#8BE0C6"), ("Shade", "#1B5E4A"), ("Sand", "#D4C4A8")
    ],
    "4. Sistema Base (Escala UI)": [
        ("Surface", "#EAF6F2"), ("Light", "#6FD1B5"), ("Base", "#2FA583"), ("Hover", "#258569"), ("Active", "#1A5C49")
    ]
}

create_palette_visual(palettes_data, "Sistema de Color #2FA583")